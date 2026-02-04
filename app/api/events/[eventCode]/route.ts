import { NextRequest, NextResponse } from "next/server";

const mockEventDetails: Record<string, any> = {
  "techfest-2026": {
    pid: "techfest-2026",
    title: "TechFest 2026",
    date: "March 15-17, 2026",
    type: "internal",
    isActive: true,
    firstSeen: "2026-01-15T10:00:00Z",
    lastSeen: "2026-02-03T23:00:00Z",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    shortDescription: "Annual technology festival featuring workshops, hackathons, and keynotes",
    longDescription: `# TechFest 2026

Join us for the biggest technology festival of the year! TechFest 2026 brings together industry leaders, innovative startups, and tech enthusiasts for three days of learning, networking, and building.

## What to Expect

- **Keynote Sessions**: Hear from top executives at leading tech companies
- **Hands-on Workshops**: Learn new skills in AI, blockchain, cloud computing, and more
- **Hackathon**: Compete for prizes worth $50,000
- **Startup Showcase**: Discover the next big thing in tech
- **Networking Events**: Connect with recruiters and industry professionals

## Schedule Highlights

**Day 1 - March 15**: Opening ceremony, keynotes, and workshop registration
**Day 2 - March 16**: Full day of workshops and the hackathon begins
**Day 3 - March 17**: Hackathon judging, closing ceremony, and awards`,
    venue: "Main Campus Auditorium",
    eventCategory: "Technology",
    clubName: "Tech Club",
    minPrice: 0,
    maxPrice: 500,
    coordinators: [
      { name: "Alex Chen", email: "alex.chen@example.com", phone: "+1-555-0101" },
      { name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1-555-0102" },
    ],
    prizes: `## Prize Pool: $50,000

### Hackathon Prizes
- **1st Place**: $20,000 + mentorship program
- **2nd Place**: $10,000 + cloud credits
- **3rd Place**: $5,000 + swag kit

### Special Categories
- Best AI/ML Project: $5,000
- Best Social Impact: $5,000
- Best UI/UX: $5,000`,
    rules: `## Participation Rules

1. Open to all students and professionals
2. Teams of 2-4 members
3. Original work only - no pre-built projects
4. Code must be submitted via GitHub
5. All participants must follow the code of conduct`,
    judgingCriteria: `## Judging Criteria

Projects will be evaluated on:

| Criteria | Weight |
|----------|--------|
| Innovation | 30% |
| Technical Complexity | 25% |
| User Experience | 20% |
| Business Viability | 15% |
| Presentation | 10% |`,
    registrationStart: "2026-01-15T00:00:00Z",
    registrationEnd: "2026-03-10T23:59:59Z",
    eventStart: "2026-03-15T09:00:00Z",
    eventEnd: "2026-03-17T18:00:00Z",
  },
  "cultural-night-2026": {
    pid: "cultural-night-2026",
    title: "Cultural Night 2026",
    date: "February 28, 2026",
    type: "internal",
    isActive: true,
    firstSeen: "2026-01-20T14:00:00Z",
    lastSeen: "2026-02-03T22:00:00Z",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    shortDescription: "A celebration of diverse cultures through music, dance, and art",
    longDescription: `# Cultural Night 2026

Experience the rich tapestry of global cultures in one spectacular evening!

## Performances

- Traditional dances from 15+ countries
- Live music performances
- Fashion show featuring cultural attire
- Food stalls with international cuisine

Join us for an unforgettable celebration of diversity and unity.`,
    venue: "Open Air Theater",
    eventCategory: "Cultural",
    clubName: "Cultural Committee",
    minPrice: 100,
    maxPrice: 300,
    coordinators: [
      { name: "Priya Sharma", email: "priya.s@example.com", phone: "+1-555-0201" },
    ],
    registrationStart: "2026-02-01T00:00:00Z",
    registrationEnd: "2026-02-25T23:59:59Z",
    eventStart: "2026-02-28T18:00:00Z",
    eventEnd: "2026-02-28T23:00:00Z",
  },
  "hackathon-spring": {
    pid: "hackathon-spring",
    title: "Spring Hackathon",
    date: "April 5-6, 2026",
    type: "external",
    isActive: true,
    firstSeen: "2026-02-01T09:00:00Z",
    lastSeen: "2026-02-03T23:00:00Z",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    shortDescription: "48-hour coding competition with prizes worth $10,000",
    longDescription: `# Spring Hackathon 2026

Build something amazing in 48 hours!

## Theme: Sustainable Technology

Create solutions that address environmental challenges using technology.

## Tracks
- Clean Energy
- Waste Management
- Sustainable Agriculture
- Smart Cities`,
    venue: "Innovation Hub",
    eventCategory: "Competition",
    clubName: "Developer Society",
    minPrice: 0,
    maxPrice: 0,
    coordinators: [
      { name: "Mike Wilson", email: "mike.w@example.com", phone: "+1-555-0301" },
    ],
    prizes: `## Prizes

- 1st Place: $5,000
- 2nd Place: $3,000
- 3rd Place: $2,000`,
    registrationStart: "2026-02-15T00:00:00Z",
    registrationEnd: "2026-04-01T23:59:59Z",
    eventStart: "2026-04-05T10:00:00Z",
    eventEnd: "2026-04-06T18:00:00Z",
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string }> }
) {
  const { eventCode } = await params;
  
  const event = mockEventDetails[eventCode];
  
  if (!event) {
    return NextResponse.json(
      { error: "Event not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(event);
}
