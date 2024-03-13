"use client"; // This is a client component 👈🏽
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const IndexPage = () => {
  const [dataChunks, setDataChunks] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('general');
  
  useEffect(() => {
    setDataChunks([]);

    // Listen for 'connect' event to ensure the connection is established
    socket.on('connect', () => {
      console.log(`Opening WebSocket for channel: ${selectedChannel}`);
      // Emit an event to start fetching data for the selected channel
      socket.emit('start_fetch', { channel: selectedChannel });
    });

    // Handle incoming data chunks
    socket.on('data_chunk', (data) => {
      console.log('Received event:', data);
      try {
        const jsonData = JSON.parse(data);

        // Here, it assumes jsonData is directly usable. Adjust as necessary.
        setDataChunks(prevChunks => [...prevChunks, jsonData]);

      } catch (error) {
        console.error('Error parsing JSON chunk', error);
      }
    });

    // Handle potential errors
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection failed:', error);
    });

    // Cleanup function to run when component unmounts or selectedChannel changes
    return () => {
      console.log('Cleanup: Closing WebSocket connection for channel:', selectedChannel);
      // Remove event listeners to prevent memory leaks
      socket.off('connect');
      socket.off('data_chunk');
      socket.off('connect_error');
      
      // No need to manually close the socket here since it's managed globally and might be used by other components/instances
    };
  }, [selectedChannel]); // Re-run this effect if selectedChannel changes
  
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
            onClick={() => handleChannelChange('code')}
            className={
              selectedChannel === 'code' ? 
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
