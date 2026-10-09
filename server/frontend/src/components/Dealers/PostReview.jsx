import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../Header/Header";
import useSession from "./useSession";
import { api } from "./api";
import "./Dashboard.css";

export default function PostReview() {
  const { id } = useParams();
  const session = useSession();
  const [dealer, setDealer] = useState(null);
  const [cars, setCars] = useState([]);
  const [model, setModel] = useState("");
  const [review, setReview] = useState("");
  const [date, setDate] = useState("");
  const [year, setYear] = useState("2023");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api("/djangoapp/dealer/" + id),
      api("/djangoapp/get_cars"),
    ]).then(([details, inventory]) => {
      if (!active) return;
      setDealer(Array.isArray(details.dealer) ? details.dealer[0] : details.dealer);
      setCars(inventory.CarModels);
    }).catch(err => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  async function submit(event) {
    event.preventDefault();
    const car = model === "" ? null : cars[Number(model)];
    const carYear = Number(year);
    if (!review.trim() || !car || !date || !Number.isInteger(carYear) ||
        carYear < 2015 || carYear > 2023) {
      setError("Complete all fields. Car year must be between 2015 and 2023.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/djangoapp/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.username,
          dealership: Number(id),
          review: review.trim(),
          purchase: true,
          purchase_date: date,
          car_make: car.CarMake,
          car_model: car.CarModel,
          car_year: carYear,
        }),
      });
      window.location.assign("/dealer/" + id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return <>
    <Header />
    <main className="bestcars-main">
      <a href={"/dealer/" + id}>Back to dealership</a>
      <h1>Post a Review</h1>
      {dealer && <h2>{dealer.full_name}</h2>}
      {error && <p role="alert" className="bestcars-error">{error}</p>}
      {session.loading || loading ? <p role="status">Loading review form...</p> :
        session.error ? <p role="alert">{session.error}</p> :
        !session.username ? <p><a href="/login/">Log in</a> to submit a review.</p> :
        dealer && <form className="bestcars-form" onSubmit={submit}>
          <fieldset disabled={saving}>
            <legend>Tell us about your purchase</legend>
            <label htmlFor="review">Your review</label>
            <textarea id="review" rows="6" required value={review}
              onChange={e => setReview(e.target.value)} />
            <label htmlFor="purchase-date">Purchase Date</label>
            <input id="purchase-date" type="date" required value={date}
              onChange={e => setDate(e.target.value)} />
            <label htmlFor="car-model">Car Make and Model</label>
            <select id="car-model" required value={model}
              onChange={e => setModel(e.target.value)}>
              <option value="">Choose Car Make and Model</option>
              {cars.map((car, index) => <option key={index} value={index}>
                {car.CarMake} {car.CarModel}
              </option>)}
            </select>
            <label htmlFor="car-year">Car Year</label>
            <input id="car-year" type="number" required min="2015"
              max="2023" step="1" value={year}
              onChange={e => setYear(e.target.value)} />
            <button className="bestcars-button" type="submit">
              {saving ? "Posting review..." : "Post Review"}
            </button>
          </fieldset>
        </form>}
    </main>
  </>;
}
