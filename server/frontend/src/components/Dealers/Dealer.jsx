import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../Header/Header";
import useSession from "./useSession";
import { api } from "./api";
import positive from "../assets/positive.png";
import neutral from "../assets/neutral.png";
import negative from "../assets/negative.png";
import "./Dashboard.css";

const icons = { positive, neutral, negative };

export default function Dealer() {
  const { id } = useParams();
  const session = useSession();
  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      api("/djangoapp/dealer/" + id),
      api("/djangoapp/reviews/dealer/" + id),
    ]).then(([details, result]) => {
      if (!active) return;
      setDealer(Array.isArray(details.dealer) ? details.dealer[0] : details.dealer);
      setReviews(result.reviews);
    }).catch(err => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  return <>
    <Header />
    <main className="bestcars-main">
      <a href="/dealers/">Back to dealerships</a>
      {error && <p role="alert" className="bestcars-error">{error}</p>}
      {loading ? <p role="status">Loading dealership and reviews...</p> : <>
        {dealer && <>
          <h1>{dealer.full_name}</h1>
          <p>{dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}</p>
          {session.username ?
            <a className="bestcars-button" href={"/postreview/" + id}>Post Review</a> :
            <p><a href="/login/">Log in</a> to post a review.</p>}
        </>}
        <h2>Customer Reviews</h2>
        {!reviews.length && !error && <p>No reviews yet.</p>}
        <div className="bestcars-reviews">
          {reviews.map(review => <article className="bestcars-card"
            key={review._id || review.id}>
            <div className="bestcars-sentiment">
              <img src={icons[review.sentiment] || neutral}
                alt={review.sentiment || "neutral"} />
              <strong>{review.sentiment || "neutral"}</strong>
            </div>
            <p className="bestcars-review-text">{review.review}</p>
            <strong>{review.name}</strong>
            <p>{review.car_make} {review.car_model} · {review.car_year}</p>
            {review.purchase && <small>Purchased: {review.purchase_date}</small>}
          </article>)}
        </div>
      </>}
    </main>
  </>;
}
