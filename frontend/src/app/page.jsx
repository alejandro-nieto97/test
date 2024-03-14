"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import io from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'wss://sea-lion-app-23rag.ondigitalocean.app/backend';
console.log('API_URL:', API_URL);
const socket = io(API_URL, {path: '/backend/socket.io'});

const IndexPage = () => {
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [dataChunks, setDataChunks] = useState([]);
  const selectedChannelRef = useRef(selectedChannel);

  useEffect(() => {
    const handleDataChunk = (data) => {
      console.log('Received event:', data);
      try {
        const jsonData = JSON.parse(data);
        setDataChunks(prevChunks => [...prevChunks, jsonData]);
      } catch (error) {
        console.error('Error parsing JSON chunk', error);
      }
    };

    const handleConnectError = (error) => {
      console.error('WebSocket connection failed:', error);
    };

    socket.on('data_chunk', handleDataChunk);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) {
      socket.emit('start_fetch', { channel: selectedChannel });
    } else {
      socket.once('connect', () => socket.emit('start_fetch', { channel: selectedChannel }));
    }

    // Cleanup function to remove listeners
    return () => {
      socket.off('connect')
      socket.off('data_chunk', handleDataChunk);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  useEffect(() => {
    if (selectedChannelRef.current !== selectedChannel) {
      selectedChannelRef.current = selectedChannel;
      console.log(`Channel changed to: ${selectedChannel}`);
      setDataChunks([]);
      socket.emit('change_channel', { channel: selectedChannel });
    }
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
          {dataChunks.length > 0 && dataChunks.slice().reverse().map((msg, index) => (
            <div key={index} className={styles.message}>
              <div className={styles.messageHeader}>
                <span className={styles.userName}>{msg.name}</span>
              </div>
              <p className={styles.messageBody}>{msg.bio}</p>
            </div>
          ))}
          {!dataChunks.length &&
            <>
              <div className={styles.message}>
                <div className={styles.messageBody}>
                  <div className={styles.dots}><span>&bull;</span><span>&bull;</span><span>&bull;</span></div>
                  <br />
                </div>
              </div>
              <div className={styles.message}>
                <div className={styles.messageBody}>
                  <div className={styles.dots}><span>&bull;</span><span>&bull;</span><span>&bull;</span></div>
                  <br />
                </div>
              </div>
              <div className={styles.message}>
                <div className={styles.messageBody}>
                  <div className={styles.dots}><span>&bull;</span><span>&bull;</span><span>&bull;</span></div>
                  <br />
                </div>
              </div>
              <div className={styles.message}>
                <div className={styles.messageBody}>
                  <div className={styles.dots}><span>&bull;</span><span>&bull;</span><span>&bull;</span></div>
                  <br />
                </div>
              </div>
            </>
          }
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
