"use client"; // This is a client component 👈🏽
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';

const IndexPage = () => {
  const [dataChunks, setDataChunks] = useState([]);

  useEffect(() => {
    const fetchDataStream = async () => {
        const eventSource = new EventSource('http://localhost:5000/fetch_data');

        eventSource.onmessage = function(event) {
            try {
                // Remove the "data: " prefix and any leading/trailing whitespaces before parsing
                const cleanData = event.data.replace(/^data: /, '').trim();
                const jsonData = JSON.parse(cleanData);
                console.log('Parsed chunk:', jsonData);
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

    fetchDataStream().catch(console.error);
  }, []);

  return (
    <div className={styles.chatApp}>
      <header className={styles.chatHeader}>
        <h1>Live Chat Stream</h1>
      </header>
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
