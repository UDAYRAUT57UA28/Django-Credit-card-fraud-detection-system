import React, { useEffect, useState } from "react";
import { getCards, addCard, freezeCard } from "../services/api";

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ card_last4: "", holder_name: "", expiry: "", card_type: "VISA" });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => getCards().then((r) => setCards(r.data.results || r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addCard(form);
      setForm({ card_last4: "", holder_name: "", expiry: "", card_type: "VISA" });
      setMsg("Card added successfully.");
      load();
    } catch { setMsg("Failed to add card."); }
  };

  const handleFreeze = async (id) => {
    await freezeCard(id);
    setMsg("Card frozen.");
    load();
  };

  return (
    <div>
      <h4 className="fw-bold mb-4">My Cards</h4>
      {msg && <div className="alert alert-info py-2">{msg}</div>}

      <div className="row g-4">
        <div className="col-md-7">
          <div className="row g-3">
            {loading && <div className="col-12 text-center"><span className="spinner-border spinner-border-sm"></span></div>}
            {cards.map((card) => (
              <div className="col-md-6" key={card.id}>
                <div className={`card border-0 shadow text-white p-3 ${card.status === "FROZEN" ? "bg-secondary" : "bg-dark"}`}>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="small opacity-75">{card.card_type}</span>
                    <span className={`badge bg-${card.status === "ACTIVE" ? "success" : "warning text-dark"}`}>{card.status}</span>
                  </div>
                  <div className="fs-5 fw-bold mb-2">**** **** **** {card.card_last4}</div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="small opacity-75">Card Holder</div>
                      <div>{card.holder_name}</div>
                    </div>
                    <div>
                      <div className="small opacity-75">Expires</div>
                      <div>{card.expiry}</div>
                    </div>
                  </div>
                  {card.status === "ACTIVE" && (
                    <button className="btn btn-sm btn-outline-light mt-3" onClick={() => handleFreeze(card.id)}>
                      <i className="bi bi-snow me-1"></i>Freeze Card
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!loading && cards.length === 0 && <p className="text-muted">No cards added yet.</p>}
          </div>
        </div>

        <div className="col-md-5">
          <div className="card border-0 shadow-sm p-4">
            <h6 className="fw-semibold mb-3">Add New Card</h6>
            <form onSubmit={handleAdd}>
              <div className="mb-2">
                <label className="form-label small">Last 4 Digits</label>
                <input className="form-control" maxLength={4} value={form.card_last4} onChange={(e) => setForm({ ...form, card_last4: e.target.value })} required />
              </div>
              <div className="mb-2">
                <label className="form-label small">Card Holder Name</label>
                <input className="form-control" value={form.holder_name} onChange={(e) => setForm({ ...form, holder_name: e.target.value })} required />
              </div>
              <div className="row g-2 mb-3">
                <div className="col">
                  <label className="form-label small">Expiry (MM/YY)</label>
                  <input className="form-control" placeholder="12/27" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} required />
                </div>
                <div className="col">
                  <label className="form-label small">Card Type</label>
                  <select className="form-select" value={form.card_type} onChange={(e) => setForm({ ...form, card_type: e.target.value })}>
                    <option>VISA</option><option>Mastercard</option><option>Amex</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-danger w-100">Add Card</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
