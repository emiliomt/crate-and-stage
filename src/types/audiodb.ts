export interface Artist {
  idArtist: string;
  strArtist: string;
  strArtistStripped: string | null;
  strArtistAlternate: string | null;
  strLabel: string | null;
  idLabel: string | null;
  intFormedYear: string | null;
  intBornYear: string | null;
  intDiedYear: string | null;
  strDisbanded: string | null;
  strStyle: string | null;
  strGenre: string | null;
  strMood: string | null;
  strWebsite: string | null;
  strFacebook: string | null;
  strTwitter: string | null;
  strBiographyEN: string | null;
  strBiographyCN: string | null;
  strBiographyDE: string | null;
  strBiographyFR: string | null;
  strBiographyIT: string | null;
  strBiographyJP: string | null;
  strBiographyRU: string | null;
  strBiographyES: string | null;
  strBiographyPT: string | null;
  strBiographySE: string | null;
  strBiographyNL: string | null;
  strBiographyHU: string | null;
  strBiographyNO: string | null;
  strBiographyIL: string | null;
  strBiographyPL: string | null;
  strGender: string | null;
  intMembers: string | null;
  strCountry: string | null;
  strCountryCode: string | null;
  strArtistThumb: string | null;
  strArtistLogo: string | null;
  strArtistCutout: string | null;
  strArtistClearart: string | null;
  strArtistWideThumb: string | null;
  strArtistFanart: string | null;
  strArtistFanart2: string | null;
  strArtistFanart3: string | null;
  strArtistFanart4: string | null;
  strArtistBanner: string | null;
  strMusicBrainzID: string | null;
  strLastFMChart: string | null;
  intCharted: string | null;
  strLocked: string;
}

export interface Album {
  idAlbum: string;
  idArtist: string;
  idLabel: string | null;
  strAlbum: string;
  strAlbumStripped: string | null;
  strArtist: string;
  strArtistStripped: string | null;
  intYearReleased: string | null;
  strStyle: string | null;
  strGenre: string | null;
  strLabel: string | null;
  strReleaseFormat: string | null;
  intSales: string | null;
  strAlbumThumb: string | null;
  strAlbumThumbHQ: string | null;
  strAlbumThumbBack: string | null;
  strAlbumCDart: string | null;
  strAlbumSpine: string | null;
  strAlbum3DCase: string | null;
  strAlbum3DFlat: string | null;
  strAlbum3DFace: string | null;
  strAlbum3DThumb: string | null;
  strDescriptionEN: string | null;
  strDescriptionDE: string | null;
  strDescriptionFR: string | null;
  strDescriptionCN: string | null;
  strDescriptionIT: string | null;
  strDescriptionJP: string | null;
  strDescriptionRU: string | null;
  strDescriptionES: string | null;
  strDescriptionPT: string | null;
  strDescriptionSE: string | null;
  strDescriptionNL: string | null;
  strDescriptionHU: string | null;
  strDescriptionNO: string | null;
  strDescriptionIL: string | null;
  strDescriptionPL: string | null;
  intLoved: string | null;
  intScore: string | null;
  intScoreVotes: string | null;
  strReview: string | null;
  strMood: string | null;
  strTheme: string | null;
  strSpeed: string | null;
  strLocation: string | null;
  strMusicBrainzID: string | null;
  strMusicBrainzArtistID: string | null;
  strAllMusicID: string | null;
  strBBCReviewID: string | null;
  strRateYourMusicID: string | null;
  strDiscogsID: string | null;
  strWikidataID: string | null;
  strWikipediaID: string | null;
  strGeniusID: string | null;
  strLyricWikiID: string | null;
  strMusicMozID: string | null;
  strItunesID: string | null;
  strAmazonID: string | null;
  strLocked: string;
}

export interface Track {
  idTrack: string;
  idAlbum: string;
  idArtist: string;
  idLyric: string | null;
  idIMVDB: string | null;
  strTrack: string;
  strAlbum: string;
  strArtist: string;
  strArtistAlternate: string | null;
  intCD: string | null;
  intDuration: string | null;
  strGenre: string | null;
  strMood: string | null;
  strStyle: string | null;
  strTheme: string | null;
  strDescriptionEN: string | null;
  strTrackThumb: string | null;
  strTrack3DCase: string | null;
  strTrackLyrics: string | null;
  strMusicVid: string | null;
  strMusicVidDirector: string | null;
  strMusicVidCompany: string | null;
  strMusicVidScreen1: string | null;
  strMusicVidScreen2: string | null;
  strMusicVidScreen3: string | null;
  intMusicVidViews: string | null;
  intMusicVidLikes: string | null;
  intMusicVidDislikes: string | null;
  intMusicVidFavorites: string | null;
  intMusicVidComments: string | null;
  intTrackNumber: string | null;
  intLoved: string | null;
  intScore: string | null;
  intScoreVotes: string | null;
  strMusicBrainzID: string | null;
  strMusicBrainzAlbumID: string | null;
  strMusicBrainzArtistID: string | null;
  strLocked: string;
}

export interface ArtistSearchResponse {
  artists: Artist[] | null;
}

export interface AlbumResponse {
  album: Album[] | null;
}

export interface TrackResponse {
  track: Track[] | null;
}
