"use client";

import { FormEvent, useState } from "react";

export default function AddListingPage() {
  const [notice, setNotice] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("İlanınız alındı. Moderasyon sonrası yayınlanacak.");
    event.currentTarget.reset();
  };

  return (
    <main className="container">
      <h1 className="section-title">İlan Ver</h1>
      <section className="panel">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div>
              <label>Başlık</label>
              <input required type="text" placeholder="Örn: iPhone 14 256 GB" />
            </div>
            <div>
              <label>Fiyat</label>
              <input required type="number" min="0" placeholder="0" />
            </div>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div>
              <label>Kategori</label>
              <select required>
                <option value="">Seçiniz</option>
                <option>Elektronik</option>
                <option>Ev ve Yaşam</option>
                <option>Moda</option>
                <option>Vasıta</option>
              </select>
            </div>
            <div>
              <label>Şehir</label>
              <select required>
                <option value="">Seçiniz</option>
                <option>İstanbul</option>
                <option>Ankara</option>
                <option>İzmir</option>
                <option>Bursa</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Açıklama</label>
            <textarea required rows={6} placeholder="Ürünü detaylı açıklayın" />
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Foto URL (MVP demo)</label>
            <input type="url" placeholder="https://..." />
          </div>

          <button className="btn btn-primary" style={{ marginTop: 12 }} type="submit">
            İlanı Gönder
          </button>
          {notice && (
            <p className="notice" style={{ marginTop: 10 }}>
              {notice}
            </p>
          )}
        </form>
      </section>
      <p className="footer">Nakits MVP — İlan girişi</p>
    </main>
  );
}
