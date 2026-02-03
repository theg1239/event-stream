import { NextRequest, NextResponse } from "next/server";

// Mock data for demonstration - in production, this would proxy to the actual event source
const mockEvents = [
  {
    pid: "techfest-2026",
    title: "TechFest 2026",
    date: "March 15-17, 2026",
    type: "internal",
    isActive: true,
    firstSeen: "2026-01-15T10:00:00Z",
    lastSeen: "2026-02-03T23:00:00Z",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    shortDescription: "Annual technology festival featuring workshops, hackathons, and keynotes",
    venue: "Main Campus Auditorium",
    eventCategory: "Technology",
    clubName: "Tech Club",
    minPrice: 0,
    maxPrice: 500,
  },
  {
    pid: "cultural-night-2026",
    title: "Cultural Night 2026",
    date: "February 28, 2026",
    type: "internal",
    isActive: true,
    firstSeen: "2026-01-20T14:00:00Z",
    lastSeen: "2026-02-03T22:00:00Z",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    shortDescription: "A celebration of diverse cultures through music, dance, and art",
    venue: "Open Air Theater",
    eventCategory: "Cultural",
    clubName: "Cultural Committee",
    minPrice: 100,
    maxPrice: 300,
  },
  {
    pid: "hackathon-spring",
    title: "Spring Hackathon",
    date: "April 5-6, 2026",
    type: "external",
    isActive: true,
    firstSeen: "2026-02-01T09:00:00Z",
    lastSeen: "2026-02-03T23:00:00Z",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    shortDescription: "48-hour coding competition with prizes worth $10,000",
    venue: "Innovation Hub",
    eventCategory: "Competition",
    clubName: "Developer Society",
    minPrice: 0,
    maxPrice: 0,
  },
  {
    pid: "music-fest-2026",
    title: "Music Festival 2026",
    date: "March 20, 2026",
    type: "external",
    isActive: true,
    firstSeen: "2026-01-25T16:00:00Z",
    lastSeen: "2026-02-03T20:00:00Z",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
    shortDescription: "Live performances from top indie bands and DJs",
    venue: "Stadium Grounds",
    eventCategory: "Music",
    clubName: "Music Society",
    minPrice: 500,
    maxPrice: 2000,
  },
  {
    pid: "ai-workshop",
    title: "AI & ML Workshop Series",
    date: "February 10-12, 2026",
    type: "internal",
    isActive: false,
    firstSeen: "2026-01-05T11:00:00Z",
    lastSeen: "2026-02-01T18:00:00Z",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
    shortDescription: "Hands-on workshops covering machine learning fundamentals",
    venue: "Computer Science Lab",
    eventCategory: "Workshop",
    clubName: "AI Club",
    minPrice: 200,
    maxPrice: 200,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = parseInt(searchParams.get("limit") || "50");

  let filtered = mockEvents;

  if (type) {
    filtered = filtered.filter((e) => e.type === type);
  }

  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    events: paginated,
    total: filtered.length,
    offset,
    limit,
  });
}
