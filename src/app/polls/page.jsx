import PollClient from '@/components/PollClient';
import { notFound } from 'next/navigation';

async function getPoll(pollId) {
  // Fetch initial poll data from your backend API
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/polls`, {
      cache: 'no-store', // Ensure fresh data for the initial load
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null; // Poll not found
      }
      throw new Error('Failed to fetch poll');
    }

    const poll = await res.json();
    return poll;
  } catch (error) {
    console.error('Error fetching poll:', error);
    return null;
  }
}

export default async function PollPage({ params }) {
  const pollId = params.id;
  const initialPollData = await getPoll(pollId);

  if (!initialPollData) {
    notFound(); // Display Next.js 404 page if poll not found
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Live Poll</h1>
      <PollClient initialPollData={initialPollData} />
    </div>
  );
}