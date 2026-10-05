
export function applyWoundWatermark(
  imageFile: File,
  protocolNumber: string,
  patientName: string,
  dateStr: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject("Canvas context is not available");
          return;
        }

        // Orijinal görsel boyutlarını koru
        canvas.width = img.width;
        canvas.height = img.height;

        // Orijinal resmi çiz
        ctx.drawImage(img, 0, 0);

        // Filigran / Etiket bandı ekleme (Alt kısımdaki opak şerit)
        const bannerHeight = Math.max(60, Math.floor(img.height * 0.08));
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

        // Metin stil ayarları
        const fontSize = Math.max(14, Math.floor(bannerHeight * 0.3));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.textBaseline = "middle";

        // Sol Kısım: Protokol No, İsim ve Tarih
        const paddingX = 20;
        const textY = img.height - bannerHeight / 2;
        ctx.fillText(`PROTOKOL: ${protocolNumber} | HASTA: ${patientName}`, paddingX, textY);

        // Sağ Kısım: Tarih ve Barkod Temsili Çizimi
        ctx.textAlign = "right";
        ctx.fillText(dateStr, img.width - paddingX, textY - (fontSize * 0.6));

        // Sahte Barkod (Barcode) Çizgileri
        const barcodeXStart = img.width - paddingX - 120;
        const barcodeYStart = img.height - bannerHeight + (bannerHeight * 0.6);
        const barcodeHeight = bannerHeight * 0.3;

        ctx.fillStyle = "#FFFFFF";
        for (let i = 0; i < 25; i++) {
          const barWidth = (i % 3 === 0 || i % 7 === 0) ? 4 : 1.5;
          const gap = i * 4.5;
          ctx.fillRect(barcodeXStart + gap, barcodeYStart, barWidth, barcodeHeight);
        }

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(imageFile);
  });
}
