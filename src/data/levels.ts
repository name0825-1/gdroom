export type Level = {
    id: number;
    rank: number;
    name: string;
    creator: string;
    verifier: string;
    video_url: string;
    points: number;
    description?: string;
};

export const MOCK_LEVELS: Level[] = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    rank: i + 1,
    name: "--",
    creator: "--",
    verifier: "--",
    video_url: "",
    points: 0,
}));
