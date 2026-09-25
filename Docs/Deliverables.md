# Deliverables

Karthik wants to see how you analyze a messy business problem and structure a solution. Keep the deck between 6 and 8 slides.
- What you are explaining: Who is in this market, why it is broken, and what people are forced to do today.
- The Players:
  1. Foreign Companies (The Buyers): A US or European company wanting to hire 50–100 engineers in India.
  2. Recruiters & EORs: People who hire staff or legally employ them before the company sets up an Indian entity.
  3. Real Estate Builders (Commercial Real Estate): Companies renting out office spaces (like tech parks).
  4. Lawyers & Accountants: People handling government paperwork, taxes, and incorporation.
  5. State Governments: States like Karnataka (Bengaluru) or Telangana (Hyderabad) competing to bring jobs to their state.
- The Information Asymmetry (The Core Pain):
  - "Information asymmetry" simply means one person has all the information while the other is kept in the dark.
  - Foreign companies don't know the local market: they get quoted ₹50,000 for something worth ₹10,000. They don't know which city actually has the best engineers for their domain (e.g., AI vs. Embedded systems).
  - Big legacy consulting firms charge $100,000+ just to prepare a PowerPoint recommending where to set up an office.
- What companies do today: They ask friends for referrals or hire expensive consultants and hope they don't get ripped off.
- What you are explaining: All the different tools you could build, and which one you should build first (your "wedge").
- What is a "Wedge"? A small, sharp product entry point that gets users hooked before you expand into a broader platform (e.g., Uber started with only luxury black cars in San Francisco before expanding to everyday rides worldwide).
- The possible opportunities:
  1. An open directory of all 2,000+ GCCs in India.
  2. A vendor review site (like a Glassdoor or Yelp, but for finding India setup lawyers and headhunters).
  3. A government subsidy tracker (which state gives tax breaks or power discounts).
  4. A city-to-city cost comparison tool.
- The Winning Wedge (What to prioritize): Focus on the Incoming Foreign Decision-Maker (The Buy-Side). Before a company hires a lawyer or signs an office lease, the leadership must answer three baseline questions:
  1. Which city makes sense for our specific domain?
  2. How much will salaries and office leases actually cost?
  3. Should we hire an EOR to start tomorrow, or spend 6 months registering a private limited company?
- What you are explaining: Exactly what the product looks like and what it does.
- The Concept: Think of it as a "PitchBook / Bloomberg for Indian GCCs." A live, dynamic website rather than an outdated 80-page PDF report.
- Key Features to describe:
  1. The GCC Atlas: A verified database of who is already operating in India, their team size, what tech stack they use, and which city they chose.
  2. City Benchmarking Matrix: Comparing metrics side-by-side (Bengaluru vs. Hyderabad vs. Pune) covering:
     - Talent availability.
     - Salary benchmarks (average pay for Senior Engineers, Product Managers).
     - Commercial rent (cost per square foot in major tech parks).
  3. Setup Route Analyzer: An interactive tool showing the time and cost differences between using an EOR vs. incorporating a direct company-owned subsidiary.
- What is "Positioning"? How you stand out against alternatives.
- What is a "Moat"? Your competitive advantage that stops rivals from copying you easily.
- The Positioning:
  - Traditional Consultants (EY, Deloitte, NASSCOM): Publish static, high-level PDF reports once a year with self-reported, conflicting survey data.
  - Your Platform: Live, filterable, interactive data updated continuously from real sources (job postings, company registries, hiring records).
- Why Flexiple wins:
  - The software acts as an organic acquisition funnel. When foreign CTOs and VPs use the free benchmarking tool to plan their India setup, the platform naturally guides them to Flexiple’s operational services (EOR and captive entity creation) to execute the plan.
Karthik explicitly stated: "You said you have built AI products - this is where I would like to see it. It does not need to be complete. It needs to work."
Do not build a 10-page complex web application. Build a clean, single-page web app with three focused features that directly answer an executive's setup questions.
- What it is: A clean table or card grid displaying real GCCs operating in India.
- Features:
  - Search bar (e.g., search "Fintech" or "Walmart").
  - Filters: By City (Bengaluru, Hyderabad, Pune, Gurugram), Sector (Fintech, Healthcare, Retail, SaaS), and Headcount Bracket (Under 50, 50–200, 500+).
  - Clicking an entry opens a modal showing verified data: Parent company country, Indian entity name, primary tech stack, and office location.
- What it is: A side-by-side comparison screen between two or three cities (e.g., Bengaluru vs. Hyderabad).
- Metrics to display:
  - Talent Cost: Average salary band for common roles (e.g., Senior Full-Stack Engineer, ML Engineer).
  - Real Estate Cost: Average commercial rent per square foot (e.g., ₹95/sq ft in Outer Ring Road, Bengaluru vs. ₹65/sq ft in HITEC City, Hyderabad).
  - Key Advantages: A quick summary of state incentives and local talent strengths.
- What is "TCO"? Total Cost of Ownership—the complete price tag of running a team, including hidden fees, taxes, compliance, and legal setup.
- What is "Build vs. Buy"?
  - Buy (EOR route): Pay a monthly service fee per employee to an EOR provider. Zero setup time, zero company registration needed.
  - Build (Direct Entity route): Pay incorporation fees, hire accountants, register an Indian Private Limited firm, and run in-house payroll.
- How the interactive calculator works:
  - The user adjusts two sliders: Team Size (e.g., 5 to 50 employees) and Timeframe (e.g., 6 to 24 months).
  - The app plots a visual chart showing where the breakeven point sits:
    - Team size under 15-20: EOR is cheaper and faster.
    - Team size over 20: Creating a dedicated entity saves substantial money over time.
- Frontend: Next.js or React with Tailwind CSS and shadcn/ui.
- Where to include AI:
  - Add a chat/search bar powered by an LLM API: "Ask anything about setting up an India GCC" (e.g., "What are the advantages of opening an AI research lab in Hyderabad over Bengaluru?").
  - The AI can synthesize answers directly against your structured city and GCC dataset using grounded context.
- Deployment: Host it live on Vercel or Netlify so Karthik can test a working link in his browser.

## Future Prospect: Ecosystem Stakeholder Flywheel

Yes. In simple terms:

Karthik is saying this should not only be a tool for foreign companies entering India. It should also give the existing GCC ecosystem a reason to participate.

Those stakeholders are:

- GCC advisors
- Big 4 firms like Deloitte, EY, PwC, KPMG
- Real estate firms
- Nasscom
- State governments
- Recruiters, lawyers, payroll/EOR providers, etc.

They already have useful information. They know which companies are setting up GCCs, which cities are growing, what office spaces cost, what incentives states offer, which service providers are reliable, and what buyers are asking for.

So when we say:

**“Ecosystem stakeholders can claim profiles, publish proof, submit verified data, and receive qualified demand signals.”**

It means:

**Claim profiles:**  
A service provider or government body can have its own page on the platform.

Example:  
“Deloitte India - GCC Advisory” or “Telangana State Investment Cell” or “CBRE Hyderabad Office Market.”

They can claim that page and say, “This is us. This is our official profile.”

**Publish proof:**  
They can show evidence that they are credible.

Example:

- Clients they have helped
- Case studies
- GCC setup experience
- Office absorption reports
- State incentive documents
- Testimonials
- Certifications
- Number of GCC projects handled

Basically: “Don’t just say you are good. Show proof.”

**Submit verified data:**  
They can contribute useful data to the platform.

Example:

- A state government uploads latest incentive schemes.
- A real estate firm submits office rent data for Bengaluru and Hyderabad.
- Nasscom contributes ecosystem-level stats.
- A GCC advisor shares setup timelines and compliance steps.

This makes the platform richer and more trustworthy.

**Receive qualified demand signals:**  
This means they get access to serious buyer interest.

Example:

A US fintech company uses the tool and searches:

“I want to set up a 75-person engineering GCC in Hyderabad in the next 6 months.”

That is a valuable signal.

A real estate firm would want to know this because the company may need office space.  
A recruiter would want to know because the company needs hiring help.  
A state government would want to attract them.  
A Big 4 firm may want to help with tax/entity setup.  
Flexiple may want to help them build the team.

So the platform becomes a meeting point between:

**Companies that want to set up in India**  
and  
**Stakeholders who can help them set up in India.**

Karthik’s line means:

“I like the buy-side tool idea, but I was also imagining something bigger: a platform that pulls in all the existing GCC ecosystem players because it gives them visibility, credibility, data, and leads.”

In even simpler words:

He is asking:

**Can this product become the place where everyone in the Indian GCC ecosystem wants to be listed, verified, discovered, and contacted?**
