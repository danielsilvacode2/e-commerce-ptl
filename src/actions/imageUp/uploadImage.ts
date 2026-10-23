const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
export async function uploadToImgBB(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error("Error uploading the image.");
    }

    return data.data.url;
}