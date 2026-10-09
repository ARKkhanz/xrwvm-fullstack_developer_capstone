import React, { useEffect, useState } from "react";
import Header from "../Header/Header";
import useSession from "./useSession";
import { api } from "./api";
import "./Dashboard.css";

export default function Dealers() {
  const session = useSession();
  const [dealers, setDealers] = useState([]);
  const [states, setStates] = useState([]);
  const [state, setState] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const endpoint = state === "All" ? "/djangoapp/get_dealers/" :
      "/djangoapp/get_dealers/" + encodeURIComponent(state);
    api(endpoint).then(data => {
      if (!active) return;
      setDealers(data.dealers);
      if (state === "All") {
        setStates([...new Set(data.dealers.map(d => d.state))].sort());
      }
    }).catch(err => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [state]);

  return <>
    <Header />
    <main className="bestcars-main">
      <h1>Explore Our Dealerships</h1>
      <p>Find a dealership and read customer reviews.</p>
      <label htmlFor="state-filter">Filter by state</label>
      <select id="state-filter" value={state}
        onChange={e => setState(e.target.value)} disabled={loading}>
        <option value="All">All States</option>
        {states.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
      {error && <p role="alert" className="bestcars-error">{error}</p>}
      {loading ? <p role="status">Loading dealerships...</p> :
        <div className="bestcars-table-wrap">
          <table className="bestcars-table">
            <thead><tr>
              <th>ID</th><th>Dealer Name</th><th>City</th>
              <th>Address</th><th>Zip</th><th>State</th>
              {session.username && <th>Review Dealer</th>}
            </tr></thead>
            <tbody>
              {dealers.map(dealer => <tr key={dealer.id}>
                <td>{dealer.id}</td>
                <td><a href={"/dealer/" + dealer.id}>{dealer.full_name}</a></td>
                <td>{dealer.city}</td><td>{dealer.address}</td>
                <td>{dealer.zip}</td><td>{dealer.state}</td>
                {session.username && <td>
                  <a className="bestcars-button" href={"/postreview/" + dealer.id}>
                    Post Review
                  </a>
                </td>}
              </tr>)}
            </tbody>
          </table>
          {!dealers.length && !error && <p>No dealerships found.</p>}
        </div>}
    </main>
  </>;
}
