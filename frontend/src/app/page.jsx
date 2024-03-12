"use client"; // This is a client component 👈🏽
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

const IndexPage = () => {
  const [dataChunks, setDataChunks] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('general');

  useEffect(() => {
    const fetchDataStream = async () => {
        const eventSource = new EventSource(`http://localhost:5000/fetch_data?channel=${selectedChannel}`);

        eventSource.onmessage = function(event) {
            try {
                // Remove the "data: " prefix and any leading/trailing whitespaces before parsing
                const cleanData = event.data.replace(/^data: /, '').trim();
                const jsonData = JSON.parse(cleanData);
                // Update state with new data chunk
                setDataChunks(prevChunks => [...prevChunks, jsonData]);
            } catch (error) {
                console.error('Error parsing JSON chunk', error);
            }
        };

        eventSource.onerror = function(error) {
            console.error('EventSource failed:', error);
            eventSource.close();
        };

        // Clean up event source when component unmounts
        return () => eventSource.close();
    };

    setDataChunks([]);
    fetchDataStream().catch(console.error);
  }, [selectedChannel]);

  const handleChannelChange = (channel) => {
    setSelectedChannel(channel);
  }

  return (
    <div className={styles.chatApp}>
      <div className={styles.chatHeader}>
        <div className={styles.resultsCount}>
          <span>Total Messages: <b>{dataChunks.length}</b></span>
        </div>
        <div className={styles.channels}> 
          <div 
            onClick={() => handleChannelChange('general')}
            className={`
              ${selectedChannel === 'general' ? 
              styles.selectedChannel : 
              styles.channelButton}`
          }>
            General
          </div>
          <div 
            onClick={() => handleChannelChange('random')}
            className={`
              ${selectedChannel === 'random' ? 
              styles.selectedChannel : 
              styles.channelButton}`
            }
          >
            Random
          </div>
          <div 
            onClick={() => handleChannelChange('coding')}
            className={
              selectedChannel === 'coding' ? 
              styles.selectedChannel : 
              styles.channelButton
            }
          >
            Coding
          </div>
        </div>
      </div>
      <div className={styles.chatContainer}>
        <div className={styles.messages}>
          {dataChunks.slice().reverse().map((msg, index) => (
            <div key={index} className={styles.message}>
              <div className={styles.messageHeader}>
                <span className={styles.userName}>{msg.name}</span>
              </div>
              <p className={styles.messageBody}>{msg.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
