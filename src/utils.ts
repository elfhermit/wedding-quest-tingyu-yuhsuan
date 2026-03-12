// 像素去背工具：將給定圖片上的特地顏色（綠色 #00FF00）轉為透明
export async function createTransparentSprite(imageUrl: string, tolerance: number = 80): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas 2D context not supported'));
                return;
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 尋找背景的白色 (通常是 #FFFFFF，也就是 255, 255, 255)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // 如果該像素偏向亮白色，則設定 Alpha 為 0 (透明)
                // 擴大 tolerance 來處理些微不純白色的像素邊緣
                if (r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
}
