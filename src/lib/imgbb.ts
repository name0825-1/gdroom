export async function uploadToImgBB(base64Data: string): Promise<string | null> {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
        console.error("IMGBB_API_KEY is not set.");
        return null;
    }

    // 만약 data:image/jpeg;base64,... 형태라면 순수 base64 데이터만 추출
    const base64String = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;

    try {
        const formData = new FormData();
        formData.append("key", apiKey);
        formData.append("image", base64String);

        const res = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success) {
            return data.data.url;
        } else {
            console.error("ImgBB Upload Failed:", data);
            return null;
        }
    } catch (error) {
        console.error("ImgBB Upload Exception:", error);
        return null;
    }
}
