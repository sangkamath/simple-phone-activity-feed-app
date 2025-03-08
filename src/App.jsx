import React from 'react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {client} from "./api/client";
import { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = 'https://aircall-api.onrender.com';

import Header from './Header.jsx';

const App = () => {
  const [activities, setActivities] = useState([]);  // State to store fetched activities
  const [loading, setLoading] = useState(true);       // Loading state to show while fetching data
  // 'feed' or 'archived' or 'detail'
  const [activeTab, setActiveTab] = useState('feed');
  // Holds the complete list of calls
  const [calls, setCalls] = useState([]);
  // For error state
  const [error, setError] = useState(null);
  // For viewing a specific call's details
  const [selectedCall, setSelectedCall] = useState(null);

  // Fetch calls on mount
  useEffect(() => {
    axios.get(`${BASE_URL}/activities`)
      .then(response => {
        setCalls(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching calls:', err);
        setError('Error fetching calls');
        setLoading(false);
      });
  }, []);

  // Helper to filter calls by archive status
  const getFeedCalls = () => calls.filter(call => !call.is_archived);
  const getArchivedCalls = () => calls.filter(call => call.is_archived);

  // Archive a single call
  const archiveCall = (id) => {
    axios.patch(`${BASE_URL}/activities/${id}`, { is_archived: true })
      .then(() => {
        setCalls(calls.map(call => call.id === id ? { ...call, is_archived: true } : call));
      })
      .catch(err => console.error(err));
  };

  // Unarchive a single call
  const unarchiveCall = (id) => {
    axios.patch(`${BASE_URL}/activities/${id}`, { is_archived: false })
      .then(() => {
        setCalls(calls.map(call => call.id === id ? { ...call, is_archived: false } : call));
      })
      .catch(err => console.error(err));
  };

  // Archive all calls in the feed
  const archiveAllCalls = () => {
    Promise.all(getFeedCalls().map(call =>
      axios.patch(`${BASE_URL}/activities/${call.id}`, { is_archived: true })
    ))
      .then(() => {
        setCalls(calls.map(call => ({ ...call, is_archived: true })));
      })
      .catch(err => console.error(err));
  };

  // Unarchive all calls in the archived view
  const unarchiveAllCalls = () => {
    Promise.all(getArchivedCalls().map(call =>
      axios.patch(`${BASE_URL}/activities/${call.id}`, { is_archived: false })
    ))
      .then(() => {
        setCalls(calls.map(call => ({ ...call, is_archived: false })));
      })
      .catch(err => console.error(err));
  };

  // When a call item is clicked, show details and switch to the detail view
  const viewCallDetail = (call) => {
    setSelectedCall(call);
    setActiveTab('detail');
  };

  // Go back to previous view (feed or archived) from detail view
  const handleBack = () => {
    setSelectedCall(null);
    // Return to feed if the call is not archived; archived otherwise.
    setActiveTab(selectedCall.is_archived ? 'archived' : 'feed');
  };

  if (loading) return <div>Loading calls...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div className='container'>
      <Header/>
      <div className="app-container">
      {/* Tabs Menu */}
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => { setActiveTab('feed'); setSelectedCall(null); }}
        >
          Activity Feed
        </div>
        <div 
          className={`tab ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => { setActiveTab('archived'); setSelectedCall(null); }}
        >
          Archived
        </div>
      </div>

      {/* Content Area */}
      <div className="content">
        {activeTab === 'feed' && (
          <div className="view feed">
            <h2>Activity Feed</h2>
            <button className="all-btn" onClick={archiveAllCalls}>Archive All</button>
            {getFeedCalls().length === 0 ? (
              <p>No active calls available.</p>
            ) : (
              <ul className="call-list">
                {getFeedCalls().map(call => (
                  <li key={call.id} className="call-item">
                    <div onClick={() => viewCallDetail(call)}>
                      <p><strong>{call.direction}</strong> call from {call.from} to {call.to} ({call.call_type})</p>
                      <p>Created at: {new Date(call.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => archiveCall(call.id)}>Archive</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'archived' && (
          <div className="view archived">
            <h2>Archived Calls</h2>
            <button className="all-btn" onClick={unarchiveAllCalls}>Unarchive All</button>
            {getArchivedCalls().length === 0 ? (
              <p>No archived calls.</p>
            ) : (
              <ul className="call-list">
                {getArchivedCalls().map(call => (
                  <li key={call.id} className="call-item">
                    <div onClick={() => viewCallDetail(call)}>
                      <p><strong>{call.direction}</strong> call from {call.from} to {call.to} ({call.call_type})</p>
                      <p>Created at: {new Date(call.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => unarchiveCall(call.id)}>Unarchive</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'detail' && selectedCall && (
          <div className="view detail">
            <button className="back-btn" onClick={handleBack}>← Back</button>
            <h2>Call Details</h2>
            <p><strong>Direction:</strong> {selectedCall.direction}</p>
            <p><strong>From:</strong> {selectedCall.from}</p>
            <p><strong>To:</strong> {selectedCall.to}</p>
            <p><strong>Call Type:</strong> {selectedCall.call_type}</p>
            <p><strong>Duration:</strong> {selectedCall.duration} seconds</p>
            <p><strong>Created At:</strong> {new Date(selectedCall.created_at).toLocaleString()}</p>
            <p><strong>Archived:</strong> {selectedCall.is_archived ? 'Yes' : 'No'}</p>
            {selectedCall.is_archived ? (
              <button onClick={() => unarchiveCall(selectedCall.id)}>Unarchive</button>
            ) : (
              <button onClick={() => archiveCall(selectedCall.id)}>Archive</button>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

const rootElement = document.getElementById('app');
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

export default App;
