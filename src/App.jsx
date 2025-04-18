import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPhoneAlt } from "react-icons/fa";
const BASE_URL = 'https://aircall-api.onrender.com';
import { CiCircleInfo } from "react-icons/ci";
import { RiInboxArchiveLine } from "react-icons/ri";
import { RiInboxUnarchiveLine } from "react-icons/ri";
import { FaCircleUser } from "react-icons/fa6";
import { MdDialpad } from "react-icons/md";
import { IoIosSettings } from "react-icons/io";
import { FaVoicemail } from "react-icons/fa";
import phoneImg from "./logo.png";


// Helper function to group calls by date (YYYY-MM-DD) and sort each group by time.
const groupCallsByDate = (calls) => {
  // Sort the calls in ascending order of creation time.
  const sortedCalls = [...calls].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
  // Group by date.
  return sortedCalls.reduce((groups, call) => {
    const date = new Date(call.created_at).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(call);
    return groups;
  }, {});
};

const formatDate = (date) => {
  const d = new Date(date);
  const formattedDate = d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  return formattedDate;
}

const App = () => {
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
    activitiesCall();
  }, []);

  // Helper to filter calls by archive status
  const getFeedCalls = () => calls.filter(call => !call.is_archived);
  const getArchivedCalls = () => calls.filter(call => call.is_archived);

  const activitiesCall = () => {
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
  }

  const activityCall = (id) => {
    axios.get(`${BASE_URL}/activities/${id}`)
      .then(response => {
        setSelectedCall(response.data)
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching call:', err);
        setError('Error fetching call');
        setLoading(false);
      });
  }

  // Archive a single call
  const archiveCall = (id) => {
    axios.patch(`${BASE_URL}/activities/${id}`, { is_archived: true })
      .then(() => {
        activitiesCall();
      })
      .catch(err => console.error(err));
  };

  // Unarchive a single call
  const unarchiveCall = (id) => {
    axios.patch(`${BASE_URL}/activities/${id}`, { is_archived: false })
      .then(() => {
        activitiesCall();
      })
      .catch(err => console.error(err));
  };

  const archiveCallFromDetails = (id) => {
    axios.patch(`${BASE_URL}/activities/${id}`, { is_archived: true })
      .then(() => {
        activityCall(id);
      })
      .catch(err => console.error(err));
  };

  // Unarchive a single call
  const unarchiveCallFromDetails = (id) => {
    axios.patch(`${BASE_URL}/activities/${id}`, { is_archived: false })
      .then(() => {
        activityCall(id);
      })
      .catch(err => console.error(err));
  };

  // Archive all calls in the feed
  const archiveAllCalls = () => {
    Promise.all(getFeedCalls().map(call =>
      axios.patch(`${BASE_URL}/activities/${call.id}`, { is_archived: true })
    ))
      .then(() => {
        activitiesCall();
      })
      .catch(err => console.error(err));
  };

  // Unarchive all calls in the archived view
  const unarchiveAllCalls = () => {
    Promise.all(getArchivedCalls().map(call =>
      axios.patch(`${BASE_URL}/activities/${call.id}`, { is_archived: false })
    ))
      .then(() => {
        activitiesCall();
      })
      .catch(err => console.error(err));
  };

  // When a call item is clicked, show details and switch to the detail view
  const viewCallDetail = (call) => {
    activityCall(call.id);
    setActiveTab('detail');
  };

  // Go back to previous view (feed or archived) from detail view
  const handleBack = () => {
    setSelectedCall(null);
    activitiesCall();
    // Return to feed if the call is not archived; archived otherwise.
    setActiveTab(selectedCall.is_archived ? 'archived' : 'feed');
  };

  if (loading) return <div>Loading calls...</div>;
  if (error) return <div>{error}</div>;

  // Group calls based on the active tab.
  const groupedData =
    activeTab === 'feed'
      ? groupCallsByDate(getFeedCalls())
      : activeTab === 'archived'
        ? groupCallsByDate(getArchivedCalls())
        : {};

  return (
    <div className='container'>
      <header className="header">
        <div className="header__left">
          <div className='logo'>
            <img src={phoneImg} alt="Logo" className="logo__image" />
          </div>
        </div>
        <div className="header__right">
          <nav className="nav">
            <ul className="nav__list">
              <span
                className={`nav__item  ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('feed');
                  setSelectedCall(null);
                }}
              >
                <a className={`nav__link  ${activeTab === 'feed' ? 'active' : ''}`}>Activity Feed</a>
              </span>
              <span
                className={`nav__item ${activeTab === 'archived' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('archived');
                  setSelectedCall(null);
                }}
              >
                <a className={`nav__link  ${activeTab === 'archived' ? 'active' : ''}`}>Archived</a>
              </span>
            </ul>
          </nav>
        </div>
      </header >
      <div className="container-view">


        {/* Content Area */}
        <div className="content">
          {activeTab === 'feed' && (
            <div className="view feed">
              <h2>Activity Feed</h2>
              <button className="button-action all-btn" onClick={archiveAllCalls}>
                Archive All
              </button>
              {Object.keys(groupedData).length === 0 ? (
                <p>No active calls available.</p>
              ) : (
                Object.keys(groupedData).map((date) => (
                  <div key={date} className="date-group">
                    <h3>{formatDate(date)}</h3>
                    <ul className="call-list">
                      {groupedData[date].map((call) => (
                        <li key={call.id} className="call-item">
                          <div className="call-info" onClick={() => viewCallDetail(call)}>
                            <p>
                              <strong>{call.direction}</strong> call from {call.from} to {call.to} ({call.call_type})
                            </p>
                            <p>
                              {new Date(call.created_at).toLocaleTimeString('en-US', {
                                timeZone: 'UTC'
                              })}
                            </p>
                          </div>
                          <div className="actions">
                            <button
                              className="button-square"
                              onClick={() => viewCallDetail(call)}
                            >
                              <CiCircleInfo size={25} />
                            </button>
                            <button className="button-square"
                              onClick={() => archiveCall(call.id)}>
                              <RiInboxArchiveLine size={25} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'archived' && (
            <div className="view archived">
              <h2>Archived Calls</h2>
              <button className="button-action all-btn" onClick={unarchiveAllCalls}>
                Unarchive All
              </button>
              {Object.keys(groupedData).length === 0 ? (
                <p>No archived calls.</p>
              ) : (
                Object.keys(groupedData).map((date) => (
                  <div key={date} className="date-group">
                    <h3>{formatDate(date)}</h3>
                    <ul className="call-list">
                      {groupedData[date].map((call) => (
                        <li key={call.id} className="call-item">
                          <div className="call-info" onClick={() => viewCallDetail(call)}>
                            <p>
                              <strong>{call.direction}</strong> call from {call.from} to {call.to} ({call.call_type})
                            </p>
                            <p>
                              {new Date(call.created_at).toLocaleTimeString('en-US', {
                                timeZone: 'UTC'
                              })}
                            </p>
                          </div>
                          <div className="actions">
                            <button
                              className="button-square"
                              onClick={() => viewCallDetail(call)}
                            >
                              <CiCircleInfo size={25} />
                            </button>
                            <button className="button-square" onClick={() => unarchiveCall(call.id)}>
                              <RiInboxUnarchiveLine size={25} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'detail' && selectedCall && (
            <div className="view detail">
              <button className="button-action back-btn" onClick={handleBack}>
                &#8592; Back
              </button>
              <h2>Call Details</h2>
              <p><strong>Direction:</strong> {selectedCall.direction}</p>
              <p><strong>From:</strong> {selectedCall.from}</p>
              <p><strong>To:</strong> {selectedCall.to}</p>
              <p><strong>Call Type:</strong> {selectedCall.call_type}</p>
              <p><strong>Duration:</strong> {selectedCall.duration} seconds</p>
              <p><strong>Created At:</strong> {new Date(selectedCall.created_at).toLocaleString('en-US', {
                timeZone: 'UTC'
              })}</p>
              <p>
                <strong>Archived:</strong>{' '}
                {selectedCall.is_archived ? 'Yes' : 'No'}
              </p>
              <br />
              {selectedCall.is_archived ? (
                <button className="button-square" onClick={() => unarchiveCallFromDetails(selectedCall.id)}>
                  <RiInboxArchiveLine size={25} /> Unarchive
                </button>
              ) : (
                <button className="button-square" onClick={() => archiveCallFromDetails(selectedCall.id)}>
                  <RiInboxUnarchiveLine size={25} /> Archive
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="footer__content">
          <ul className="nav__list footer__list">
          <span
                className={`nav__item  ${activeTab === 'feed' ? 'active' : ''}`}
              >
                <button className="button-square" >
                  <FaPhoneAlt size={20} color="green"/> 
                </button>
              </span>
              <span
                className={`nav__item ${activeTab === 'archived' ? 'active' : ''}`}
              >
                <button className="button-square">
                  <FaCircleUser size={25} /> 
                </button>
              </span>
              <span
                className={`nav__item ${activeTab === 'archived' ? 'active' : ''}`}
              >
                <button className="button-square" >
                  <MdDialpad size={25} /> 
                </button>
              </span>
              <span
                className={`nav__item ${activeTab === 'archived' ? 'active' : ''}`}
              >
                <button className="button-square" >
                <IoIosSettings size={25} />
                </button>
              </span>
              <span
                className={`nav__item ${activeTab === 'archived' ? 'active' : ''}`}
              >
                <button className="button-square" >
                <FaVoicemail size={25} /> 
                  </button>
              </span>
          </ul>
        </div>
      </footer>
    </div >
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
