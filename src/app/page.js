"use client";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [isVoting, setIsVoting] = useState(false);

  const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  // Initialize socket
  const socket = useMemo(() => {
    if (!socketUrl) return null;
    return io(socketUrl, { autoConnect: false });
  }, [socketUrl]);

  // Fetch polls on mount
  useEffect(() => {
    async function fetchPolls() {
      const res = await fetch(`${socketUrl}/api/v1/polls`);
      const data = await res.json();
      setPolls(data.polls || []);

      // Join all polls in socket rooms
      socket?.on("connect", () => {
        console.log("Socket connected");
        data.polls.forEach((poll) => socket.emit("joinPoll", poll.id));
      });
    }
    fetchPolls();
  }, [socket]);

  // Listen for socket updates
  useEffect(() => {
    if (!socket) return;
    socket.connect();

    socket.on("pollUpdated", (updated) => {
      setPolls((prev) =>
        prev.map((poll) =>
          poll.id === updated.pollId
            ? { ...poll, options: updated.options }
            : poll
        )
      );
    });

    return () => socket.disconnect();
  }, [socket]);

  // Submit vote
  const submitVote = async (pollId, optionId) => {
    setIsVoting(true);
    try {
      const res = await fetch(`${socketUrl}/api/v1/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollOptionId: optionId }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const data = await res.json();

      // Use backend results to update poll options
      setPolls((prev) =>
        prev.map((poll) =>
          poll.id === pollId ? { ...poll, options: data.results } : poll
        )
      );
    } catch (err) {
      console.error(err);
      alert("Vote failed");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">All Polls</h1>

      {polls.map((poll) => {
        const totalVotes = poll.options.reduce(
          (sum, o) => sum + (o.votes || 0),
          0
        );

        return (
          <div key={poll.id} className="mb-8 border rounded-lg p-4 shadow">
            <h2 className="text-xl font-semibold mb-4">{poll.question}</h2>
            <div className="space-y-3">
              {poll.options.map((option) => {
                const percent = totalVotes
                  ? Math.round(((option.votes || 0) / totalVotes) * 100)
                  : 0;

                return (
                  <div
                    key={option.id}
                    className="flex items-center justify-between border p-2 rounded cursor-pointer"
                  >
                    <label className="flex items-center w-full">
                      <input
                        type="radio"
                        name={`poll-${poll.id}`}
                        value={option.id}
                        disabled={isVoting}
                        onChange={() => submitVote(poll.id, option.id)}
                        className="mr-2"
                      />
                      {option.text}
                    </label>

                    <div className="w-32 text-right">
                      <div>{percent}%</div>
                      <div className="w-full h-2 bg-gray-200 rounded mt-1">
                        <div
                          className="h-2 bg-indigo-600 rounded"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-2 text-sm text-gray-400">
              Total votes: {totalVotes}
            </p>
          </div>
        );
      })}
    </main>
  );
}
