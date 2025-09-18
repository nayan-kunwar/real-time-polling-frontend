"use client";
import { getOrCreateUser } from "@/utils/user";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [isVoting, setIsVoting] = useState(false);

  const socketUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const socket = useMemo(() => {
    if (!socketUrl) return null;
    return io(socketUrl, { autoConnect: false });
  }, [socketUrl]);

  useEffect(() => {
    if (!socketUrl || !socket) return; 

    async function fetchPolls() {
      const res = await fetch(`${socketUrl}/api/v1/polls`);
      const data = await res.json();
      const pollList = Array.isArray(data) ? data : data.polls || [];
      setPolls(pollList);

      socket.connect();
      socket.on("connect", () => {
        console.log("✅ Connected to WebSocket");
        pollList.forEach((poll) => {
          console.log(`Joining poll room: ${poll.id}`);
          socket.emit("joinPoll", poll.id);
        });
      });
    }

    fetchPolls();
    return () => socket.disconnect();
  }, [socket, socketUrl]);

  useEffect(() => {
    if (!socket) return;

    socket.on("updateResults", (results) => {
      console.log("📊 Received updateResults:", results);
      if (!results.length) return;
      const pollId = results[0].pollId || results.pollId;
      if (!pollId) {
        console.warn("No pollId in results payload");
        return;
      }
      setPolls((prev) =>
        prev.map((poll) =>
          poll.id === pollId ? { ...poll, options: results } : poll
        )
      );
    });

    return () => socket.off("updateResults");
  }, [socket]);

  const submitVote = async (pollId, optionId) => {
    setIsVoting(true);
    try {
      const userId = await getOrCreateUser(socketUrl);
      const res = await fetch(`${socketUrl}/api/v1/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pollOptionId: optionId }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const data = await res.json();
      if (data.results) {
        setPolls((prev) =>
          prev.map((poll) =>
            poll.id === pollId ? { ...poll, options: data.results } : poll
          )
        );
      }
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
                    onClick={() => !isVoting && submitVote(poll.id, option.id)}
                    className="flex items-center justify-between border p-2 rounded cursor-pointer 
                               hover:bg-indigo-50  hover:text-gray-900 active:scale-95 transition 
                               transition-transform duration-150 ease-out"
                  >
                    <input
                      type="radio"
                      name={`poll-${poll.id}`}
                      value={option.id}
                      disabled={isVoting}
                      className="sr-only"
                      readOnly
                    />
                    <span className="flex-1">{option.text}</span>

                    <div className="w-32 text-right">
                      <div>{percent}%</div>
                      <div className="w-full h-2 bg-gray-200 rounded mt-1">
                        <div
                          className="h-2 bg-indigo-600 rounded transition-all duration-300 ease-out"
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
