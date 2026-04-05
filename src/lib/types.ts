import { Timestamp } from "firebase/firestore";

export interface EventFeatures {
  agenda: boolean;
  shoutouts: boolean;
  reactions: boolean;
  photos: boolean;
  trivia: boolean;
  pledges: boolean;
  rsvp: boolean;
}

export interface Event {
  name: string;
  date: string;
  tagline: string;
  eventStartTime: string;
  currentProgramId: string | null;
  announcementText: string;
  announcementActive: boolean;
  bigScreenMode: string;
  adminPasswordHash: string;
  features?: EventFeatures;
  phase?: 'rsvp' | 'live' | 'ended';
  flyerUrl?: string;
  iconUrl?: string;
  pledgeCostPerUnit?: number;
  pledgeLabel?: string;
  createdAt: Timestamp;
}

export interface Program {
  id: string;
  title: string;
  performers: string;
  emoji: string;
  durationMinutes: number;
  order: number;
  status: "upcoming" | "live" | "completed";
  heroImageUrl?: string;
  description?: string;
  surprise?: boolean;
  createdAt: Timestamp;
}

export interface Viewer {
  id: string;
  displayName: string;
  initials: string;
  joinedAt: Timestamp;
  lastActive: Timestamp;
  isOnline: boolean;
}

export interface Reaction {
  id: string;
  emoji: string;
  viewerId: string;
  programId: string;
  createdAt: Timestamp;
}

export interface Shoutout {
  id: string;
  text: string;
  viewerId: string;
  displayName: string;
  upvotes: number;
  upvotedBy: string[];
  status: "visible" | "flagged" | "deleted";
  createdAt: Timestamp;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  order: number;
  status: "draft" | "active" | "revealed" | "closed";
  createdAt: Timestamp;
}

export interface TriviaAnswer {
  id: string;
  questionId: string;
  viewerId: string;
  displayName: string;
  selectedIndex: number;
  correct: boolean;
  answeredAt: Timestamp;
}

export interface Photo {
  id: string;
  imageUrl: string;
  caption: string;
  viewerId: string;
  displayName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

export interface Pledge {
  id: string;
  name: string;
  email: string;
  phone: string;
  numberOfKids: number;
  totalAmount: number;
  viewerId: string;
  createdAt: Timestamp;
}

export interface Feedback {
  id: string;
  rating: number;
  enjoyed: string[];
  improve: string[];
  comment: string;
  createdAt: Timestamp;
}

export interface Rsvp {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'going' | 'maybe' | 'not-going';
  numberOfGuests: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function parseTime(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatTime(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function computeProgramTimes(
  programs: Program[],
  eventStartTime: string,
): { startTime: string; endTime: string }[] {
  let cursor = parseTime(eventStartTime || '5:00 PM');
  return programs.map((p) => {
    const start = formatTime(cursor);
    cursor += p.durationMinutes || 0;
    const end = formatTime(cursor);
    return { startTime: start, endTime: end };
  });
}
