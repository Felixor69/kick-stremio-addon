const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");
const cors = require("cors");

const app = express();
const cache = new NodeCache({ stdTTL: 300 });
const PORT = process.env.PORT || 3000;

app.use(cors());

const streamers = [
  {
    id: "kick-randombrucetv",
    username: "randombrucetv",
    name: "RandomBruceTV",
    poster: "https://static-cdn.jtvnw.net/jtv_user_pictures/86d30ba4-4ff3-487b-9aa4-b60e3e498e5c-profile_image-300x300.png",
    background: "https://kick.com/randombrucetv/cover-image.jpg",
    description: "Streamer z Kick.com"
  },
  {
    id: "kick-overpow",
    username: "overpow",
    name: "Overpow",
    poster: "https://static-cdn.jtvnw.net/jtv_user_pictures/fc3e038e-fac7-47ed-9e3d-4cb2e6a623a2-profile_image-300x300.png",
    background: "https://kick.com/overpow/cover-image.jpg",
    description: "Polski streamer – gameplaye, rozmowy i więcej"
  },
  {
    id: "kick-mokrysuchar",
    username: "mokrysuchar",
    name: "MokrySuchar",
    poster: "https://kick.com/mokrysuchar/cover-image.jpg",
    background: "https://kick.com/mokrysuchar/cover-image.jpg",
    description: "Suchar na mokro – humor i granie"
  },
  {
    id: "kick-delordione",
    username: "delordione",
    name: "Delord",
    poster: "https://kick.com/delordione/cover-image.jpg",
    background: "https://kick.com/delordione/cover-image.jpg",
    description: "Delord – esportowy klimat"
  },
  {
    id: "kick-kubon",
    username: "kubon",
    name: "Kubon",
    poster: "https://kick.com/kubon/cover-image.jpg",
    background: "https://kick.com/kubon/cover-image.jpg",
    description: "LoL i więcej z Kubonem"
  },
  {
    id: "kick-xntentacion",
    username: "xntentacion",
    name: "Xntentacion",
    poster: "https://kick.com/xntentacion/cover-image.jpg",
    background: "https://kick.com/xntentacion/cover-image.jpg",
    description: "Polski Xntentacion – gaming"
  },
  {
    id: "kick-arquel",
    username: "arquel",
    name: "Arquel",
    poster: "https://kick.com/arquel/cover-image.jpg",
    background: "https://kick.com/arquel/cover-image.jpg",
    description: "Arquel – gry, humor, interakcja"
  }
];

app.get("/manifest.json", (req, res) => {
  res.json({
    id: "kick.manual.addon",
    version: "1.0.0",
    name: "Kick.tv Addon",
    description: "Streamy z Kick.com (PL)",
    resources: ["catalog", "meta", "stream"],
    types: ["tv"],
    catalogs: [
      {
        type: "tv",
        id: "kick-catalog",
        name: "Kick Streamerzy",
        extra: [{ name: "search", isRequired: false }]
      }
    ]
  });
});

app.get("/catalog/tv/kick-catalog.json", (req, res) => {
  const metas = streamers.map((s) => ({
    id: s.id,
    type: "tv",
    name: s.name,
    poster: s.poster,
    description: s.description
  }));
  res.json({ metas });
});

app.get("/catalog/tv/kick-catalog/search=:search.json", (req, res) => {
  const searchTerm = req.params.search.toLowerCase();
  const filtered = streamers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm) ||
      s.description.toLowerCase().includes(searchTerm)
  );
  const metas = filtered.map((s) => ({
    id: s.id,
    type: "tv",
    name: s.name,
    poster: s.poster,
    description: s.description
  }));
  res.json({ metas });
});

app.get("/meta/tv/:id.json", (req, res) => {
  const s = streamers.find((s) => s.id === req.params.id);
  if (!s) return res.status(404).json({ meta: null, error: "Streamer not found" });

  res.json({
    meta: {
      id: s.id,
      type: "tv",
      name: s.name,
      poster: s.poster,
      description: s.description,
      background: s.background
    }
  });
});

app.get("/stream/tv/:id.json", async (req, res) => {
  const s = streamers.find((s) => s.id === req.params.id);
  if (!s) return res.status(404).json({ streams: [], error: "Streamer not found" });

  const cacheKey = `stream_${s.id}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get(`https://kick.com/api/v2/channels/${s.username}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json",
        "Referer": `https://kick.com/${s.username}`,
        "Origin": "https://kick.com"
      },
      timeout: 5000
    });

    const playback = response.data?.playback_url;
    if (!playback) return res.status(404).json({ streams: [], error: "Stream not available" });

    const streamInfo = {
      streams: [
        {
          title: "Kick.tv Live",
          url: playback
        }
      ]
    };
    cache.set(cacheKey, streamInfo);
    res.json(streamInfo);
  } catch (e) {
    console.error("Stream error:", e.message);
    res.status(500).json({ streams: [], error: "Failed to fetch stream" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Addon live on port ${PORT}`);
});
