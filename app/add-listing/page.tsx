"use client";

import { FormEvent, useState } from "react";

export default function AddListingPage() {
  const [notice, setNotice] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("Ilaniniz alindi. Moderasyon sonrasi yayinlanacak.");
    event.currentTarget.reset();
  };

  return (
    <main className="container">
      <h1 className="section-title">Ilan Ver</h1>
      <section className="panel">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div>
              <label>Baslik</label>
              <input required type="text" placeholder="Orn: iPhone 14 256 GB" />
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
                <option value="">Seciniz</option>
                <option>Elektronik</option>
                <option>Ev ve Yasam</option>
                <option>Moda</option>
                <option>Vasita</option>
              </select>
            </div>
            <div>
              <label>Sehir</label>
              <select required>
                <option value="">Seciniz</option>
                <option>Istanbul</option>
                <option>Ankara</option>
                <option>Izmir</option>
                <option>Bursa</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Aciklama</label>
            <textarea required rows={6} placeholder="Urunu detayli aciklayin" />
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Foto URL (MVP demo)</label>
            <input type="url" placeholder="https://..." />
          </div>

          <button className="btn btn-primary" style={{ marginTop: 12 }} type="submit">
            Ilani Gonder
          </button>
          {notice && (
            <p className="notice" style={{ marginTop: 10 }}>
              {notice}
            </p>
          )}
        </form>
      </section>
      <p className="footer">Nakits MVP - Ilan Giris</p>
    </main>
  );
}
