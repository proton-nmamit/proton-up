export interface ProtonEvent {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'competition' | 'workshop' | 'outreach' | 'cultural' | 'talk';
  categoryLabel: string;
  status: 'completed' | 'upcoming' | 'ongoing';
  date: string;
  formattedDate: string;
  time: string;
  location: string;
  imageUrl: string;
  registrationOpen: boolean;
  registrationLink?: string;
  highlights?: string[];
  isFeatured?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: 'presidents' | 'technical' | 'media' | 'graphics' | 'event_mgmt' | 'cultural_sports' | 'class_rep';
  categoryLabel: string;
  department?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  isCore: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  eventName: string;
  date: string;
  category: string;
  imageUrl: string;
  description?: string;
}

export const PROTON_META = {
  name: "PROTON Association",
  fullName: "PROACTIVE ORGANISATION FOR THREATS AND ONLINE NETWORKS",
  tagline: "Innovate. Collaborate. Excel. Repeat.",
  slogan: "Think deeper. Hack smarter. Stay secure.",
  description: "The official Cybersecurity Association of NMAM Institute of Technology, dedicated to creating a security-aware community and bridging theoretical knowledge with hands-on technical excellence.",
  foundedYear: "2024",
  department: "Department of Computer Science & Engineering (Cybersecurity)",
  institution: "NMAM Institute of Technology, Nitte Deemed to be University",
  location: "NMAMIT Campus, Nitte, Karkala, Karnataka - 574110",
  contactEmail: "proton.cybsec@nmamit.in",
  secondaryEmail: "contact@proton.edu",
  stats: {
    members: "30+",
    coreMembers: "30+",
    eventsConducted: "13+",
    projectsCompleted: "24+",
    workshopsHeld: "25+",
    yearsActive: "2+",
  },
  socials: {
    github: "https://github.com/proton-nmamit",
    linkedin: "https://linkedin.com/company/proton-nmamit",
    instagram: "https://instagram.com/proton_nmamit",
    discord: "https://discord.gg/proton",
  }
};

export const CORE_VALUES = [
  {
    code: "[>>]",
    title: "Innovation",
    description: "Pushing boundaries in offensive and defensive security, artificial intelligence, and cutting-edge software solutions.",
    icon: "ShieldAlert"
  },
  {
    code: "[++]",
    title: "Collaboration",
    description: "Fostering teamwork, peer-to-peer mentoring, and vibrant developer communities that solve real-world problems together.",
    icon: "Users"
  },
  {
    code: "[**]",
    title: "Excellence",
    description: "Striving for industry-grade standards in code, security audits, competitive programming, and research publications.",
    icon: "Award"
  },
  {
    code: "[</>]",
    title: "Continuous Learning",
    description: "Hands-on exploration through Capture The Flag (CTF) challenges, kernel internals, binary exploitation, and cloud labs.",
    icon: "Terminal"
  }
];

export const WHAT_WE_DO = [
  {
    title: "Cybersecurity & CTFs",
    tag: "Defensive & Offensive",
    description: "Hands-on workshops in penetration testing, network sniffing, reverse engineering, web exploitation, and hosting campus-wide CTFs.",
    icon: "Shield"
  },
  {
    title: "Technical Workshops",
    tag: "Hands-on Training",
    description: "Deep-dive bootcamps covering AI/ML security, DevSecOps, Cloud Computing, Fullstack Systems, and Linux Kernel fundamentals.",
    icon: "Cpu"
  },
  {
    title: "Hackathons & Ideathons",
    tag: "Innovation Arena",
    description: "High-octane competitions like Fish Tank NITTE and Ctrl+Alt Code challenging developers to architect scalable and secure products.",
    icon: "Terminal"
  },
  {
    title: "Cyber Awareness Outreach",
    tag: "Community Impact",
    description: "Social impact programs educating high schools and PU colleges on cyber safety, digital hygiene, and threat mitigation.",
    icon: "Network"
  }
];

export const PROTON_EVENTS: ProtonEvent[] = [
  {
    id: "journey-to-japan",
    title: "Journey from NMAMIT to Japan",
    description: "A special talk by Mr. Sachin Ronson Dsilva from NIDEC Instruments, Japan, sharing his inspiring journey from NMAMIT to building a successful international tech career. Covered global career growth, Japanese corporate culture, and engineering opportunities.",
    category: "talk",
    categoryLabel: "Global Keynote",
    status: "completed",
    date: "2024-08-08",
    formattedDate: "August 8, 2024",
    time: "09:00 AM",
    location: "NMAMIT Campus",
    imageUrl: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["International Career Pathways", "NIDEC Instruments Insights", "Q&A with NMAMIT Alumni"]
  },
  {
    id: "eyeq-cybersecurity-roadmap",
    title: "Seminar by EyeQ Dot Net",
    description: "Comprehensive seminar on Cybersecurity Roadmaps conducted by the security team at EyeQ Dot Net. The speakers guided students through foundational skills, certifications (OSCP, CEH, Security+), threat intelligence, and industry hiring trends.",
    category: "workshop",
    categoryLabel: "Industry Workshop",
    status: "completed",
    date: "2024-08-08",
    formattedDate: "August 8, 2024",
    time: "09:00 AM",
    location: "NMAMIT Main Auditorium",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["SOC & Penetration Testing", "Security Certifications Guide", "Industry Mentorship"]
  },
  {
    id: "cyber-insight-1",
    title: "Cyber Insight 1.0",
    description: "A beginner-friendly hands-on cybersecurity workshop designed exclusively for first-year and junior engineers. Introduced participants to Kali Linux, Wireshark, Nmap, Burp Suite, and basic ethical hacking principles with live demonstrations.",
    category: "workshop",
    categoryLabel: "Hands-on Bootcamp",
    status: "completed",
    date: "2024-08-31",
    formattedDate: "August 31, 2024",
    time: "09:00 AM",
    location: "Cybersecurity Lab, NMAMIT",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["Kali Linux Setup", "Packet Sniffing & Port Scanning", "Beginner CTF Lab"]
  },
  {
    id: "fish-tank-nitte",
    title: "Fish Tank NITTE",
    description: "Inspired by Shark Tank, this premier entrepreneurship and tech pitch event gave students a stage to present innovative prototypes, business models, and software architectures before a distinguished panel of industry judges.",
    category: "competition",
    categoryLabel: "Startup Pitch",
    status: "completed",
    date: "2024-10-19",
    formattedDate: "October 19, 2024",
    time: "09:00 AM",
    location: "Incubation Center, NMAMIT",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["Live Venture Pitching", "Product Prototyping", "Angel & Faculty Feedback"]
  },
  {
    id: "cyber-awareness-outreach",
    title: "Cyber Awareness Programme",
    description: "A month-long social initiative where PROTON core members conducted extensive digital hygiene and cyber safety seminars across regional high schools and pre-university colleges. Educated over 1,200 students on avoiding phishing scams and social media risks.",
    category: "outreach",
    categoryLabel: "Social Outreach",
    status: "completed",
    date: "2024-10-21",
    formattedDate: "October 21, 2024",
    time: "09:00 AM",
    location: "Partner High Schools & PU Colleges",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["1,200+ Students Reached", "Anti-Phishing Demos", "Safe Social Media Habits"]
  },
  {
    id: "bond-and-beyond",
    title: "Bond and Beyond",
    description: "An exclusive community engagement and team-building gathering for Cybersecurity Department students. Featured technical trivia, cryptanalysis games, interactive coding challenges, and collaborative networking.",
    category: "cultural",
    categoryLabel: "Community Gathering",
    status: "completed",
    date: "2024-11-23",
    formattedDate: "November 23, 2024",
    time: "09:00 AM",
    location: "Shambhavi Hall, NMAMIT",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["Team Building", "Cryptography Puzzles", "Student Community Networking"]
  },
  {
    id: "cyber-loop",
    title: "Cyber Loop",
    description: "An intensive masterclass by Rishi Bhati (President, PROTON) analyzing advanced cyber threat landscapes, zero-day vulnerabilities, adversary emulation, and career opportunities in modern red-team and blue-team operations.",
    category: "talk",
    categoryLabel: "Advanced Keynote",
    status: "completed",
    date: "2024-12-02",
    formattedDate: "December 2, 2024",
    time: "10:00 AM",
    location: "Virtual & Seminar Hall 3",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["Zero-Day Vulnerabilities", "Red Teaming Architecture", "Offensive Security Tooling"]
  },
  {
    id: "research-paper-writing",
    title: "Research Paper Writing Workshop",
    description: "Mentorship workshop conducted by Dr. Roshan Fernandes, Head of the Department of Cybersecurity. Guided students through literature surveys, academic methodology, LaTeX authoring, structuring IEEE/Springer papers, and targeting peer-reviewed venues.",
    category: "workshop",
    categoryLabel: "Academic & Research",
    status: "completed",
    date: "2025-01-16",
    formattedDate: "January 16, 2025",
    time: "11:00 AM",
    location: "Cybersecurity Seminar Hall, NMAMIT",
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["IEEE & Scopus Guidelines", "LaTeX Document Preparation", "Research Methodology"]
  },
  {
    id: "ctrl-alt-code",
    title: "Ctrl + Alt Code",
    description: "Competitive programming and algorithmic sprint organized in collaboration with the Computer Society of India (CSI). Contenders tackled time-bound algorithmic challenges across dynamic programming, graph theory, and cryptographic ciphers.",
    category: "competition",
    categoryLabel: "Coding Competition",
    status: "completed",
    date: "2025-01-25",
    formattedDate: "January 25, 2025",
    time: "09:30 AM",
    location: "Central Computer Center, NMAMIT",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["Algorithmic Showdown", "CSI NMAMIT Joint Event", "Prizes & Leaderboard"]
  },
  {
    id: "japanese-placements-insight",
    title: "Insights to Japanese Placements",
    description: "An executive briefing on career pathways in Tokyo and Osaka's tech corridors. Discussed technical skill benchmarks, Japanese business communication (JLPT N4/N3 prep), hiring timelines, and visa sponsorships for engineering graduates.",
    category: "talk",
    categoryLabel: "Career Guidance",
    status: "completed",
    date: "2025-03-27",
    formattedDate: "March 27, 2025",
    time: "11:30 AM",
    location: "NMAMIT Campus",
    imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["Tokyo Tech Market Analysis", "JLPT Requirements", "Mock Interview Best Practices"]
  },
  {
    id: "cyber-insight-2",
    title: "Cyber Insight 2.0",
    description: "The second edition of PROTON's flagship hands-on security workshop. Included live attack-defense simulations, reverse engineering binaries with Ghidra, exploitation with Metasploit, and real-time defense log analysis.",
    category: "workshop",
    categoryLabel: "Advanced Workshop",
    status: "completed",
    date: "2025-08-09",
    formattedDate: "August 9, 2025",
    time: "09:00 AM",
    location: "NMAMIT Cyber Defense Lab",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["Ghidra Reverse Engineering", "Live Metasploit Exploits", "Blue Team Log Auditing"]
  },
  {
    id: "game-of-conquest",
    title: "Game of Conquest: Battle for the Throne",
    description: "\"When you play the game of thrones, you win or you die... there is no middle ground.\" An epic 3-round battle of wit, mental agility, cryptanalysis, and strategic problem-solving inspired by the world of Westeros.",
    category: "competition",
    categoryLabel: "Flagship Challenge",
    status: "completed",
    date: "2025-08-23",
    formattedDate: "August 23, 2025",
    time: "09:00 AM",
    location: "Mechanical Workshop Arena, NMAMIT",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    registrationOpen: true,
    registrationLink: "https://forms.gle/4nJ7QrjtmuLUYbWX9",
    highlights: ["3 Multi-tier Challenge Rounds", "Strategy & Crypto Puzzles", "Campus-Wide Grand Prize"]
  },
  {
    id: "antakshari-incridea",
    title: "Antakshari @ Incridea",
    description: "High-energy musical battle hosted by PROTON during NMAMIT's national annual festival Incridea. Packed auditorium featuring audiovisual rounds, song identification ciphers, and enthusiastic student participation.",
    category: "cultural",
    categoryLabel: "Festive Cultural",
    status: "completed",
    date: "2025-02-27",
    formattedDate: "February 27, 2025",
    time: "10:30 AM",
    location: "Sambharam Auditorium, NMAMIT",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    registrationOpen: false,
    registrationLink: "#",
    highlights: ["Incridea Fest Official Event", "Multilingual Rounds", "1,000+ Audience Members"]
  }
];

export const PROTON_TEAM: TeamMember[] = [
  // Presidents & Leads
  {
    id: "rishi-bhati",
    name: "Rishi Bhati",
    role: "President",
    category: "presidents",
    categoryLabel: "Executive Leadership",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/1000098689_fpknsx",
    bio: "Passionate about red-teaming, adversary simulation, and building vibrant hacker communities at NMAMIT.",
    github: "https://github.com/Rishi-Bhati",
    linkedin: "https://linkedin.com/in/rishibhati5",
    instagram: "https://instagram.com/rishibhati5",
    isCore: true
  },
  {
    id: "sakshat-s",
    name: "Sakshat S",
    role: "Vice President",
    category: "presidents",
    categoryLabel: "Executive Leadership",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/1000101311_zf2o5q",
    bio: "Driving strategic initiatives, technical bootcamps, and cross-department collaboration.",
    github: "https://github.com/Sakshats993",
    linkedin: "https://www.linkedin.com/in/sakshat-salian-0796a230b",
    instagram: "https://www.instagram.com/sakshatsalian",
    isCore: true
  },
  {
    id: "vruddith-shetty",
    name: "Vruddith R Shetty",
    role: "Branch Captain",
    category: "presidents",
    categoryLabel: "Executive Leadership",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/Screenshot_2025-09-11_104936_va2fnm",
    github: "https://github.com/VruddithShetty",
    linkedin: "https://www.linkedin.com/in/vruddithshetty",
    instagram: "https://www.instagram.com/vruddith._.shetty",
    isCore: true
  },

  // Technical
  {
    id: "prashith-shetty",
    name: "Prashith Shetty",
    role: "Technical Head",
    category: "technical",
    categoryLabel: "Technical Division",
    department: "CSE CYB",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/1000055701_mrhnlx",
    bio: "Lead architect of PROTON infrastructure, CTF labs, and system engineering.",
    isCore: true
  },
  {
    id: "nithin-kr",
    name: "Nithin K R",
    role: "Technical Co-ordinator",
    category: "technical",
    categoryLabel: "Technical Division",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/DSC_2760_g4mxuu",
    github: "https://github.com/NITHINKR06",
    linkedin: "https://www.linkedin.com/in/nithinkr06",
    instagram: "https://instagram.com/_nithin.kr_",
    isCore: true
  },
  {
    id: "anish-prabhu",
    name: "Anish Prabhu",
    role: "Technical Co-ordinator",
    category: "technical",
    categoryLabel: "Technical Division",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/1000065046_qxmbu1",
    github: "https://github.com/ashpb07",
    linkedin: "https://www.linkedin.com/in/anish-prabhu-08aa44320",
    instagram: "https://www.instagram.com/_anishprabhu",
    isCore: true
  },

  // Secretaries & Treasurers
  {
    id: "su-anusha",
    name: "S U Anusha",
    role: "Secretary",
    category: "event_mgmt",
    categoryLabel: "Operations & Management",
    department: "Computer Science (Cybersecurity)",
    isCore: true
  },
  {
    id: "shreya-shridhara",
    name: "Shreya Shridhara",
    role: "Joint Secretary",
    category: "event_mgmt",
    categoryLabel: "Operations & Management",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/protonn_xbnfd4",
    isCore: true
  },
  {
    id: "ananya-nayak",
    name: "Ananya S Nayak",
    role: "Treasurer",
    category: "event_mgmt",
    categoryLabel: "Operations & Management",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/IMG-20250827-WA00831_x5wtpe",
    github: "https://github.com/Ananyasn98",
    linkedin: "https://www.linkedin.com/in/ananya-s-nayak-18171b363",
    instagram: "https://www.instagram.com/nayak.ananyas",
    isCore: true
  },
  {
    id: "pranjal-shetty",
    name: "Pranjal Shetty",
    role: "Joint Treasurer",
    category: "event_mgmt",
    categoryLabel: "Operations & Management",
    department: "CSE CYB",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/pranjalproton_g6efkm",
    github: "https://github.com/PranjalShetty",
    linkedin: "https://www.linkedin.com/in/pranjalshetty/",
    instagram: "https://www.instagram.com/pranjall.shetty/",
    isCore: true
  },

  // Media & Social Media
  {
    id: "mohammed-shaadaan",
    name: "Mohammed Shaadaan Sheikh",
    role: "Media Head",
    category: "media",
    categoryLabel: "Media & Branding",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/1000108654_orj8sh",
    github: "https://github.com/Shxdy10",
    linkedin: "https://www.linkedin.com/in/mohammed-shaadaan-sheikh-70a68428b",
    instagram: "https://www.instagram.com/shxdy10",
    isCore: true
  },
  {
    id: "keerthan-jogi",
    name: "Keerthan Jogi",
    role: "Social Media Head",
    category: "media",
    categoryLabel: "Media & Branding",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/IMG_4156_bvnex3",
    github: "https://github.com/keerthxnj0gi",
    linkedin: "https://www.linkedin.com/in/keerthan-jogi-ab1349323",
    instagram: "https://www.instagram.com/keerthanj0gi",
    isCore: true
  },
  {
    id: "suhan-shetty",
    name: "Suhan S Shetty",
    role: "Social Media Co-ordinator",
    category: "media",
    categoryLabel: "Media & Branding",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/IMG_20250514_211528_080_Original_dscbqx",
    github: "https://github.com/swansety",
    linkedin: "https://www.linkedin.com/in/suhan-shetty-883a5330b",
    instagram: "https://www.instagram.com/suhanshetty1",
    isCore: true
  },
  {
    id: "thilakraj-sk",
    name: "S K Thilakraj",
    role: "Media Co-ordinator",
    category: "media",
    categoryLabel: "Media & Branding",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/1000280136_sy14r6",
    isCore: true
  },

  // Graphics
  {
    id: "pratheeksha",
    name: "Pratheeksha",
    role: "Graphic Head",
    category: "graphics",
    categoryLabel: "Design & Graphics",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/36535_untp9t",
    isCore: true
  },
  {
    id: "thanush-j",
    name: "Thanush J",
    role: "Graphic Co-ordinator",
    category: "graphics",
    categoryLabel: "Design & Graphics",
    department: "CSE CYB",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/DSC_3174_kuw2yh",
    github: "https://github.com/ThanushJ46",
    linkedin: "https://www.linkedin.com/in/thanush-j-a24495326",
    instagram: "https://www.instagram.com/thanush_birwa",
    isCore: true
  },

  // Event Management & Cultural / Sports
  {
    id: "vidya-kamath",
    name: "Vidya Kamath",
    role: "Event Management Co-ordinator",
    category: "event_mgmt",
    categoryLabel: "Operations & Management",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/IMG_20250829_232538_cmutmn",
    github: "https://github.com/Vidya-kama-th",
    linkedin: "https://www.linkedin.com/in/vidyalakshmi-kamath-086311325",
    instagram: "https://www.instagram.com/_vidya_kamath_",
    isCore: true
  },
  {
    id: "suvarna-samiksha",
    name: "Suvarna Samiksha Mohan",
    role: "Cultural Co-ordinator",
    category: "cultural_sports",
    categoryLabel: "Cultural & Athletics",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/1000056766_axxarn",
    github: "https://github.com/proton-nmamit",
    linkedin: "https://www.linkedin.com/in/suvarna-samiksha-mohan-116721381",
    instagram: "https://www.instagram.com/suvarna_samiksha_",
    isCore: true
  },
  {
    id: "anvi-shetty",
    name: "Anvi Shetty",
    role: "Cultural Co-ordinator",
    category: "cultural_sports",
    categoryLabel: "Cultural & Athletics",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/1000126191_qrjyvg",
    github: "https://github.com/proton-nmamit",
    linkedin: "https://www.linkedin.com/in/anvii-shetty-564713381",
    instagram: "https://www.instagram.com/anvyshettyy",
    isCore: true
  },
  {
    id: "bhavin-adyanthaya",
    name: "Bhavin Adyanthaya",
    role: "Sports Co-ordinator",
    category: "cultural_sports",
    categoryLabel: "Cultural & Athletics",
    department: "Computer Science (Cybersecurity)",
    avatarUrl: "https://res.cloudinary.com/ddugleiyp/image/upload/w_200,h_200,c_fill,g_face/media/team/members_images/WhatsApp_Image_2025-10-15_at_12.30.14_ffd6cac8_nx40uz",
    github: "https://github.com/tree-04",
    linkedin: "https://www.linkedin.com/in/bhavin-adyanthaya-2023ab320",
    instagram: "https://instagram.com/bha.vin04",
    isCore: true
  },

  // Class Representatives
  {
    id: "calvin-dsouza",
    name: "Calvin Dsouza",
    role: "Class Representative",
    category: "class_rep",
    categoryLabel: "Student Council & CRs",
    department: "Computer Science (Cybersecurity)",
    isCore: true
  },
  {
    id: "neha-devadiga",
    name: "Neha Devadiga",
    role: "Class Representative",
    category: "class_rep",
    categoryLabel: "Student Council & CRs",
    department: "Computer Science (Cybersecurity)",
    isCore: true
  },
  {
    id: "sindhoora-r",
    name: "Sindhoora R",
    role: "Class Representative",
    category: "class_rep",
    categoryLabel: "Student Council & CRs",
    department: "Computer Science (Cybersecurity)",
    isCore: true
  },
  {
    id: "amithesh-sequeira",
    name: "Amithesh Sequeira",
    role: "Class Representative",
    category: "class_rep",
    categoryLabel: "Student Council & CRs",
    department: "CSE CYB",
    isCore: true
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Game of Conquest Arena",
    eventName: "Game of Conquest",
    date: "August 2025",
    category: "Competitions",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    description: "Competitors solving live cryptographic challenges in round 2."
  },
  {
    id: "gal-2",
    title: "Hands-on Exploitation Lab",
    eventName: "Cyber Insight 2.0",
    date: "August 2025",
    category: "Workshops",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    description: "Live packet analysis and buffer overflow defense walkthrough."
  },
  {
    id: "gal-3",
    title: "Fish Tank Pitch Session",
    eventName: "Fish Tank NITTE",
    date: "October 2024",
    category: "Competitions",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    description: "Student teams presenting cybersecurity product prototypes."
  },
  {
    id: "gal-4",
    title: "Incridea Musical Night",
    eventName: "Antakshari @ Incridea",
    date: "February 2025",
    category: "Cultural",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    description: "Packed auditorium during the final tie-breaker round."
  },
  {
    id: "gal-5",
    title: "High School Cyber Clinic",
    eventName: "Cyber Awareness Programme",
    date: "October 2024",
    category: "Outreach",
    imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
    description: "Interactive session teaching young students safe password hygiene."
  },
  {
    id: "gal-6",
    title: "Ctrl + Alt Code Sprint",
    eventName: "Ctrl + Alt Code",
    date: "January 2025",
    category: "Competitions",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    description: "Intense coding sprint in NMAMIT central computer center."
  },
  {
    id: "gal-7",
    title: "Japan Placements Keynote",
    eventName: "Insights to Japanese Placements",
    date: "March 2025",
    category: "Seminars",
    imageUrl: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
    description: "Sachin Ronson Dsilva discussing global tech careers."
  },
  {
    id: "gal-8",
    title: "Research Paper Workshop",
    eventName: "Research Paper Writing Workshop",
    date: "January 2025",
    category: "Workshops",
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
    description: "Dr. Roshan Fernandes mentoring students on IEEE paper formatting."
  }
];
