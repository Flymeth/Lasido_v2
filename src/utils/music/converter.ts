import playdl, {
	Deezer,
	DeezerAlbum,
	DeezerPlaylist,
	DeezerTrack,
	SoundCloud,
	SoundCloudPlaylist,
	SoundCloudTrack,
	Spotify,
	SpotifyAlbum,
	SpotifyPlaylist,
	SpotifyTrack,
	YouTubePlayList,
	YouTubeVideo,
} from "play-dl";
import { getPool } from "../db";
import { refetchVideoInformationsEachMs } from "../../../database/_settings.json";

export const cache = new Map<string, YouTubeVideo>();
export type service_id = "so" | "yt" | "sp" | "dz";
export function getID(url: URL | string) {
	if (typeof url === "string") url = new URL(url);
	if (playdl.yt_validate(url.toString())) {
		const id = url.searchParams.get("v");
		if (id) return id;
	}
	return /\/([^/]+)$/.exec(url.pathname)?.[1] || null;
}
export function getBDDKey(
	track: SpotifyTrack | DeezerTrack | SoundCloudTrack | YouTubeVideo
) {
	const service: service_id =
		track instanceof SpotifyTrack
			? "sp"
			: track instanceof DeezerTrack
			? "dz"
			: track instanceof SoundCloudTrack
			? "so"
			: "yt";
	return { service, id: getID(track.url) };
}
export function getSearchQueryFrom(
	track: SpotifyTrack | DeezerTrack | SoundCloudTrack | YouTubeVideo,
	vendors = true
): string {
	if (track instanceof YouTubeVideo && track.title) return track.title;

	const title =
		track instanceof YouTubeVideo || track instanceof DeezerTrack
			? track.title
			: track.name;
	const artists =
		track instanceof YouTubeVideo
			? [track.channel?.name || ""]
			: "contributors" in track && track.contributors
			? track.contributors.map((u) => u.name)
			: "artist" in track
			? [track.artist.name]
			: "artists" in track
			? track.artists.map((u) => u.name)
			: [track.user.name];

	if (vendors) return `Music ${title} by ${artists.join(", ")}`;
	else return `${title} ${artists.join(" ")}`;
}
export function youtubeVideoToJSON(video: YouTubeVideo): object {
	const result: { [key: string]: any } = {};

	for (const [prop, data] of Object.entries(video)) {
		switch (typeof data) {
			case "function":
			case "symbol":
				break;
			case "object":
				result[prop] = JSON.parse(JSON.stringify(data));
				break;
			case "bigint":
				result[prop] = new Number(data);
				break;
			default:
				result[prop] = data;
				break;
		}
	}

	return result;
}

export async function fetchTrackFromDB(id: string, service: service_id) {
	const dbPool = await getPool();

	const parameters: { [key in service_id | "all"]?: [string, string[]] } = {
		yt: ["SELECT INFOS, DATE FROM cache WHERE ID = ?", [id]],
		all: [
			"SELECT YT_ID, INFOS, DATE FROM converter " +
				"JOIN cache ON converter.YT_ID = cache.ID " +
				"WHERE converter.ID = ? AND service = ?",
			[id, service],
		],
	};
	const params = service in parameters ? parameters[service] : parameters.all;
	if (!params) return null;

	const saved = await dbPool
		.query<
			{
				YT_ID?: string;
				INFOS: object;
				DATE: Date;
			}[]
		>(...params)
		.catch(() => [null])
		.then((r) => r[0]);

	if (
		saved?.INFOS &&
		Date.now() - saved.DATE.getTime() < refetchVideoInformationsEachMs
	) {
		const data: { [key: string]: any } =
			typeof saved.INFOS === "string"
				? JSON.parse(saved.INFOS)
				: saved.INFOS;
		const video = new YouTubeVideo(data);

		// ? Some informations are lost when instanciate the class from datas
		video.durationInSec = data.durationInSec;

		return video;
	}
	return null;
}

/**
 * Convert a link or platform's track into a youtube video(s)
 * THIS FUNCTION DOES NOT HANDLE SEARCHING!
 */
export async function convertToYoutubeVideos(
	...tracks: (
		| SoundCloud
		| Spotify
		| Deezer
		| YouTubePlayList
		| YouTubeVideo
		| URL
		| string
	)[]
): Promise<
	(
		| YouTubeVideo
		| {
				source:
					| DeezerAlbum
					| DeezerPlaylist
					| SpotifyAlbum
					| SpotifyPlaylist
					| SoundCloudPlaylist
					| YouTubePlayList;
				videos: YouTubeVideo[];
		  }
	)[]
> {
	const result = await Promise.all(
		tracks.map(async (track, init_index) => {
			if (typeof track === "string" || track instanceof URL) {
				const query = track.toString();
				if (cache.has(query))
					return {
						init_index,
						data: cache.get(query) as YouTubeVideo,
					};

				const source = await playdl.validate(query);
				if (!source)
					throw new Error(
						`The track with query [${query}] cannot be processed...`
					);
				if (source === "search")
					throw new Error(
						"This function cannot handle the search method..."
					);

				if (source.startsWith("yt")) {
					if (source === "yt_video") {
						const video_ID = getID(query);
						const saved =
							video_ID &&
							(await fetchTrackFromDB(video_ID, "yt"));
						if (saved) return { data: saved, init_index };
						else {
							let videoDetails;
							while (!videoDetails) {
								videoDetails = await playdl
									.video_basic_info(query)
									.then((r) => r.video_details)
									.catch(() => undefined);
							}
							saveToDB(videoDetails);
							return { init_index, data: videoDetails };
						}
					} else {
						const playlist = await playdl.playlist_info(query);
						const videos = await playlist.all_videos();
						return {
							init_index,
							data: {
								source: playlist,
								videos: await convertToYoutubeVideos(
									...videos
								).then((result) =>
									result.filter(
										(r): r is YouTubeVideo =>
											r instanceof YouTubeVideo
									)
								),
							},
						};
					}
				} else {
					//? Récupération depuis la bdd
					if (
						source === "dz_track" ||
						source === "sp_track" ||
						source === "so_track"
					) {
						const service = source.slice(0, 2) as service_id;
						const id = getID(query);
						const saved =
							id && (await fetchTrackFromDB(id, service));
						if (saved) return { data: saved, init_index };
					}

					//? Si la ressource n'est pas dans la bdd ou que la ressource est trop ancienne...
					const answer = await (source.startsWith("dz")
						? playdl.deezer
						: source.startsWith("so")
						? playdl.soundcloud
						: playdl.spotify)(query);

					if (
						answer instanceof DeezerTrack ||
						answer instanceof SpotifyTrack ||
						answer instanceof SoundCloudTrack
					) {
						const video = await convertToYoutubeVideos(answer).then(
							(r) => r[0]
						);
						return { init_index, data: video };
					} else {
						const tracks = await answer.all_tracks();
						const videos = await convertToYoutubeVideos(...tracks);
						return {
							init_index,
							data: {
								source: answer,
								videos: videos.filter(
									(r): r is YouTubeVideo =>
										r instanceof YouTubeVideo
								),
							},
						};
					}
				}
			} else if (track instanceof YouTubeVideo) {
				saveToDB(track);
				return { init_index, data: track };
			} else if (
				track instanceof SpotifyAlbum ||
				track instanceof SpotifyPlaylist ||
				track instanceof DeezerAlbum ||
				track instanceof DeezerPlaylist ||
				track instanceof SoundCloudPlaylist ||
				track instanceof YouTubePlayList
			) {
				const tracks = await ("all_tracks" in track
					? track.all_tracks
					: track.all_videos)();
				const videos = await convertToYoutubeVideos(...tracks);
				return {
					init_index,
					data: {
						source: track,
						videos: videos.filter(
							(r): r is YouTubeVideo => r instanceof YouTubeVideo
						),
					},
				};
			} else {
				const { id, service } = getBDDKey(track);
				const saved = id && (await fetchTrackFromDB(id, service));

				if (saved) return { data: saved, init_index };
				else {
					const query = getSearchQueryFrom(track);
					const video = await playdl
						.search(query, {
							source: { youtube: "video" },
							limit: 1,
						})
						.then((r) => r[0]);
					saveToDB(video, track);
					return { init_index, data: video };
				}
			}
		})
	);

	for (let i = 0; i < result.length; i++) {
		const [video, source] = [result[i], tracks[i]];
		if (!(video.data instanceof YouTubeVideo)) continue;

		let srcURL: string | undefined;
		if (typeof source === "string" || source instanceof URL)
			srcURL = source.toString();
		else srcURL = source.url;

		if (srcURL && !cache.has(srcURL)) cache.set(srcURL, video.data);
	}

	return result
		.sort((a, b) => b.init_index - a.init_index)
		.map(({ data }) => data);
}
export function individualyConvertToYoutubeVideos(
	...tracks: (
		| SoundCloud
		| Spotify
		| Deezer
		| YouTubePlayList
		| YouTubeVideo
		| URL
		| string
	)[]
) {
	return tracks.map((item) => {
		return () => convertToYoutubeVideos(item).then((v) => v[0]);
	});
}

async function saveToDB(
	youtubeVideo: YouTubeVideo,
	source?: SpotifyTrack | DeezerTrack | SoundCloudTrack | YouTubeVideo
) {
	const dbPool = await getPool();
	const data = youtubeVideoToJSON(youtubeVideo);

	await dbPool.query(
		"INSERT INTO cache VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `INFOS` = ?, `DATE` = NOW()",
		[youtubeVideo.id, data, data]
	);
	if (source) {
		const { id, service } = getBDDKey(source);
		await dbPool.query(
			"INSERT INTO converter (ID, SERVICE, YT_ID) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `YT_ID` = ?",
			[id, service, youtubeVideo.id, youtubeVideo.id]
		);
	}
}
