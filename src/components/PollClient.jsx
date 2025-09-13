'use client'; // This directive marks the file as a Client Component

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket; // Declare socket outside to maintain a single instance

const PollClient = ({ initialPollData }) => {
  const [poll, setPoll] = useState(initialPollData);

  useEffect(() => {
    // Function to initialize socket connection
    const socketInitializer = async () => {
      // Connect to the backend Socket.IO server
      // If using the Next.js API route: window.location.origin
      // If using a separate backend: 'http://localhost:4000' (or your backend URL)
      socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin, {
        path: '/api/socket', // Only needed if using Next.js API route for socket server
        addTrailingSlash: false, // Prevents double slashes in path
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        // Join the specific poll room when connected
        if (poll?.id) {
          socket.emit('joinPoll', poll.id);
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Listen for 'pollUpdate' events from the server
      socket.on('pollUpdate', (updatedPoll) => {
        console.log('Received poll update:', updatedPoll);
        if (updatedPoll.id === poll.id) {
          setPoll(updatedPoll);
        }
      });

      // Clean up on component unmount
      return () => {
        if (socket) {
          if (poll?.id) {
            socket.emit('leavePoll', poll.id);
          }
          socket.disconnect();
          console.log('Socket disconnected on cleanup');
        }
      };
    };

    if (!socket) { // Only initialize if socket doesn't exist
      socketInitializer();
    } else {
      // If component re-renders and socket already exists, ensure it's in the correct room
      if (poll?.id) {
        socket.emit('joinPoll', poll.id);
      }
    }

    // Handle leaving the room if pollId changes or component unmounts
    return () => {
      if (socket && poll?.id) {
        socket.emit('leavePoll', poll.id);
      }
    };

  }, [poll?.id]); // Re-run effect if poll ID changes

  if (!poll) {
    return <div>Loading poll...</div>;
  }

  const handleVote = async (optionId) => {
    // Send vote to your backend REST API
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if your API requires it
        },
        body: JSON.stringify({ optionId, userId: 'someUserId' }), // Replace with actual user ID
      });

      if (!res.ok) {
        throw new Error('Failed to cast vote');
      }

      const data = await res.json();
      console.log('Vote submitted:', data);
      // No need to setPoll here, the socket update will handle it
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow-lg">
      <h1 className="text-2xl font-bold mb-4">{poll.question}</h1>
      <ul className="space-y-2">
        {poll.options.map((option) => (
          <li key={option.id} className="flex items-center justify-between bg-gray-100 p-3 rounded">
            <span className="text-lg">{option.text}</span>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-blue-600">{option.votes || 0} votes</span>
              <button
                onClick={() => handleVote(option.id)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Vote
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PollClient;