const BANK = [
    {
        id: "wr-1",
        topic: "Overwhelm",
        hook: "You can't do everything today.",
        caption: "Pick ONE needle-moving task. Let the rest slide. Progress isn't about volume, it's about direction."
    },
    {
        id: "wr-2",
        topic: "Anxiety",
        hook: "You're not failing. You're just exhausted.",
        caption: "Stop trying to push through burnout. Give yourself permission to disconnect completely for an hour."
    },
    {
        id: "wr-3",
        topic: "Focus",
        hook: "Your phone is an slot machine.",
        caption: "If you can't focus, put your phone in another room. Create physical distance between you and the distraction."
    },
    {
        id: "wr-4",
        topic: "Loneliness",
        hook: "If nobody told you today: you matter.",
        caption: "It is normal to feel disconnected sometimes. Reach out to one person today, even just with a text."
    },
    {
        id: "wr-5",
        topic: "Sleep",
        hook: "Revenge bedtime procrastination.",
        caption: "Staying up late because you had no free time during the day ruins tomorrow. Prioritize sleep to reclaim your day."
    },
    {
        id: "wr-6",
        topic: "Motivation",
        hook: "Motivation follows action.",
        caption: "Don't wait to feel ready. Do 5 minutes of the task poorly. Momentum will quickly take over."
    },
    {
        id: "wr-7",
        topic: "Boundaries",
        hook: "'No' is a complete sentence.",
        caption: "You don't need to overexplain or apologize for protecting your peace and your time."
    },
    {
        id: "wr-8",
        topic: "Decision Fatigue",
        hook: "The 10-10-10 Rule.",
        caption: "Will this matter in 10 days? 10 months? 10 years? If not, don't waste energy stressing over it today."
    },
    {
        id: "wr-9",
        topic: "Relationships",
        hook: "Don't guess what they're thinking.",
        caption: "Assume positive intent. If something bothers you, ask directly. Unspoken expectations destroy relationships."
    },
    {
        id: "wr-10",
        topic: "Habits",
        hook: "You're trying to change too much.",
        caption: "Discipline starts small. Pick one micro-habit (like making the bed) and execute it daily for a week."
    },
    {
        id: "wr-11",
        topic: "Confidence",
        hook: "Imposter syndrome is normal.",
        caption: "Everyone is figuring it out as they go. Shift your mindset from 'I need to know everything' to 'I am capable of learning'."
    },
    {
        id: "wr-12",
        topic: "Finance",
        hook: "You can't budget your way out of burnout.",
        caption: "Automate your savings, delete shopping apps from your phone, and stop using retail therapy as stress relief."
    },
    {
        id: "wr-13",
        topic: "Mindset",
        hook: "Stop complaining. Start changing.",
        caption: "Venting feels good but changes nothing. If a problem is fixable, fix it. If it isn't, accept it and move forward."
    },
    {
        id: "wr-14",
        topic: "Anxiety",
        hook: "Write it down to let it go.",
        caption: "Your brain is designed to generate ideas, not hold them. Dump your worries onto paper to stop the looping thoughts."
    },
    {
        id: "wr-15",
        topic: "Social",
        hook: "You're overthinking the interaction.",
        caption: "People are mostly thinking about themselves, not judging your tiny mistake. Give yourself grace."
    },
    {
        id: "wr-16",
        topic: "Growth",
        hook: "Failure is data.",
        caption: "Remove the emotional weight from failing. It's just feedback telling you what adjustment to make next."
    },
    {
        id: "wr-17",
        topic: "Self Care",
        hook: "Hydration before caffeine.",
        caption: "Your brain shrinks when dehydrated, causing brain fog and anxiety. Drink 16oz of water before your first coffee."
    },
    {
        id: "wr-18",
        topic: "Productivity",
        hook: "The '2-Minute Rule'.",
        caption: "If a task takes less than 2 minutes, do it right now. Stop accumulating tiny tasks that drain your mental RAM."
    },
    {
        id: "wr-19",
        topic: "Perspective",
        hook: "Compare yourself to yourself.",
        caption: "Looking at someone else's highlight reel will only make you miserable. Are you better than you were yesterday?"
    },
    {
        id: "wr-20",
        topic: "Boundaries",
        hook: "You do not have to be available 24/7.",
        caption: "Turn off non-essential notifications. Being instantly reachable is a modern trap that destroys deep work."
    },
    {
        id: "wr-21",
        topic: "Mindset",
        hook: "Action cures fear.",
        caption: "The longer you wait to do the scary thing, the scarier it gets. Take the smallest possible step right now."
    },
    {
        id: "wr-22",
        topic: "Overwhelm",
        hook: "Your environment dictates your mind.",
        caption: "A cluttered room equals a cluttered mind. Spend 5 minutes daily purely putting things back where they belong."
    },
    {
        id: "wr-23",
        topic: "Focus",
        hook: "Multitasking is a myth.",
        caption: "You aren't doing two things at once; you're just doing two things poorly. Focus on one activity until it's done."
    },
    {
        id: "wr-24",
        topic: "Mental Health",
        hook: "Breathe in for 4, out for 6.",
        caption: "Taking longer exhales activates the parasympathetic nervous system, chemically lowering your heart rate and stress."
    },
    {
        id: "wr-25",
        topic: "Self Talk",
        hook: "Would you say that to a friend?",
        caption: "Stop being so horribly mean to yourself in your own head. Replace self-criticism with self-compassion."
    },
    {
        id: "wr-26",
        topic: "Productivity",
        hook: "Eat the frog.",
        caption: "Do the hardest, most dreadful task first thing in the morning when your willpower is highest. The rest of the day is easy."
    },
    {
        id: "wr-27",
        topic: "Social",
        hook: "Listen to understand.",
        caption: "Most people listen just waiting for their turn to speak. Try actually hearing the other person out before formulating a reply."
    },
    {
        id: "wr-28",
        topic: "Mindset",
        hook: "Everything is figureoutable.",
        caption: "No matter how dense a problem seems, there is a next step. Break it down until the next step is stupidly simple."
    },
    {
        id: "wr-29",
        topic: "Confidence",
        hook: "Stand up straight.",
        caption: "Your physiology impacts your psychology. Pushing your shoulders back and lifting your chin actually makes you feel braver."
    },
    {
        id: "wr-30",
        topic: "Resilience",
        hook: "This too shall pass.",
        caption: "Both the great moments and the terrible ones are temporary. Stay grounded in the good times, stay hopeful in the bad."
    },
    {
        id: "wr-31",
        topic: "Loneliness",
        hook: "Be the one who reaches out.",
        caption: "Stop waiting for people to plan things. Invite someone for coffee. They are probably waiting for someone to reach out too."
    },
    {
        id: "wr-32",
        topic: "Finance",
        hook: "The 24-hour rule.",
        caption: "Before buying anything non-essential, put it in your cart and wait 24 hours. Most of the time, the impulse fades."
    },
    {
        id: "wr-33",
        topic: "Sleep",
        hook: "Darkness is a sleep signal.",
        caption: "Looking at bright screens at 11 PM destroys melatonin production. Switch to warm lighting in the evening."
    },
    {
        id: "wr-34",
        topic: "Growth",
        hook: "Consistency > Intensity.",
        caption: "Working out for 15 minutes a day for a year yields way better results than going hardcore once a month."
    },
    {
        id: "wr-35",
        topic: "Decision Fatigue",
        hook: "Automate your choices.",
        caption: "Eat the same breakfast. Wear a similar uniform. Save your daily decision-making power for things that actually matter."
    },
    {
        id: "wr-36",
        topic: "Mindset",
        hook: "You don't lack time, you lack clarity.",
        caption: "When you know exactly what the priority is, you will find the time. Map out your top 3 tasks for tomorrow, tonight."
    },
    {
        id: "wr-37",
        topic: "Anxiety",
        hook: "What's the worst case scenario?",
        caption: "Follow the fear all the way down. You'll usually realize the worst case is highly survivable, removing the problem's teeth."
    },
    {
        id: "wr-38",
        topic: "Relationships",
        hook: "Quality time requires presence.",
        caption: "You aren't spending time with them if you're scrolling on your phone. Put it away. Look them in the eyes."
    },
    {
        id: "wr-39",
        topic: "Mental Health",
        hook: "You are allowed to say 'I don't know'.",
        caption: "You don't need an opinion on every internet controversy. Free yourself from the burden of constant outrage."
    },
    {
        id: "wr-40",
        topic: "Self Care",
        hook: "A shower is a reset button.",
        caption: "When you feel completely stuck, go take a cold or hot shower. It physically snaps your brain out of its current loop."
    },
    {
        id: "wr-41",
        topic: "Focus",
        hook: "Clear your desk.",
        caption: "Physical clutter competes for your visual attention. A clear workspace drastically reduces cognitive load."
    },
    {
        id: "wr-42",
        topic: "Energy",
        hook: "Protect your mornings.",
        caption: "Do not open email or social media the second you wake up. Give yourself the first 30 minutes of the day."
    },
    {
        id: "wr-43",
        topic: "Perspective",
        hook: "Nobody is thinking about you.",
        caption: "They are too busy worrying about what you think of them. Stop holding yourself back over imaginary judgments."
    },
    {
        id: "wr-44",
        topic: "Productivity",
        hook: "Done is better than perfect.",
        caption: "Perfectionism is just procrastination wearing a suit. Hit publish, send the email, launch the project."
    },
    {
        id: "wr-45",
        topic: "Habits",
        hook: "Never miss twice.",
        caption: "Missed your workout today? Fine. It happens. But do whatever it takes to ensure you don't miss tomorrow."
    },
    {
        id: "wr-46",
        topic: "Self Worth",
        hook: "Your job is not your identity.",
        caption: "You are more than what you do for money. Cultivate hobbies, relationships, and interests outside the office."
    },
    {
        id: "wr-47",
        topic: "Mindset",
        hook: "Focus on the controllable.",
        caption: "Worrying about the economy, the weather, or other people's actions is useless. Focus on your own response."
    },
    {
        id: "wr-48",
        topic: "Social",
        hook: "Remember names.",
        caption: "A person's name is the sweetest sound to them. Say it back when introduced, and use it in conversation."
    },
    {
        id: "wr-49",
        topic: "Mental Health",
        hook: "Take a walk without inputs.",
        caption: "No music. No podcasts. Allow yourself 15 minutes of sensory silence to let your brain defragment."
    },
    {
        id: "wr-50",
        topic: "Finance",
        hook: "Pay yourself first.",
        caption: "Put money into savings the second you get paid. If you wait to save what's left, there will be nothing left."
    },
    {
        id: "wr-51",
        topic: "Communication",
        hook: "Stop saying 'I'm sorry'.",
        caption: "Replace 'Sorry for being late' with 'Thank you for your patience.' It shifts the tone from guilt to gratitude."
    },
    {
        id: "wr-52",
        topic: "Growth",
        hook: "Embrace the cringe.",
        caption: "Being terrible at something is the first step to being slightly good at something. Don't hide from being a beginner."
    },
    {
        id: "wr-53",
        topic: "Sleep",
        hook: "Cool down to sleep better.",
        caption: "Your core temperature needs to drop to initiate sleep. Keep the bedroom cool for massively better rest."
    },
    {
        id: "wr-54",
        topic: "Motivation",
        hook: "Design your environment.",
        caption: "Relying on willpower is a losing battle. If you want to eat healthier, simply do not keep junk food in the house."
    },
    {
        id: "wr-55",
        topic: "Overwhelm",
        hook: "Brain dump everything.",
        caption: "Write down every single thing on your mind, big or small. Getting it onto paper breaks the feeling of overload."
    },
    {
        id: "wr-56",
        topic: "Relationships",
        hook: "You cannot change them.",
        caption: "You can only change how you react and what boundaries you set. Stop wasting energy trying to fix people."
    },
    {
        id: "wr-57",
        topic: "Mindset",
        hook: "Happiness is a baseline.",
        caption: "Stop chasing massive highs. Find quiet contentment in the small routines: good coffee, a walk, a clean room."
    },
    {
        id: "wr-58",
        topic: "Focus",
        hook: "Work in deep blocks.",
        caption: "90 minutes of zero-distraction work will yield more output than 5 hours of distracted, fragmented effort."
    },
    {
        id: "wr-59",
        topic: "Anxiety",
        hook: "Are you breathing?",
        caption: "When we get stressed, we subconsciously hold our breath or chest breathe. Drop your shoulders and take a belly breath."
    },
    {
        id: "wr-60",
        topic: "Growth",
        hook: "You have plenty of time.",
        caption: "You aren't falling behind. Erase the imaginary timeline in your head and just focus on making today slightly better."
    },
    {
        id: "wr-61",
        topic: "Procrastination",
        hook: "Stop relying on willpower.",
        caption: "Willpower depletes. Systems don't. Make the good habit easy to start, and the bad habit hard to access."
    },
    {
        id: "wr-62",
        topic: "Anxiety",
        hook: "3-3-3 Rule.",
        caption: "Look around and name 3 things you see. Name 3 sounds you hear. Move 3 parts of your body. Ground yourself."
    },
    {
        id: "wr-63",
        topic: "Focus",
        hook: "The Zeigarnik effect.",
        caption: "Our brains obsess over unfinished tasks. Unplugging starts by writing down where you left off, so your mind can rest."
    },
    {
        id: "wr-64",
        topic: "Growth",
        hook: "Don't take criticism from someone you wouldn't take advice from.",
        caption: "If they don't have the life, peace, or success you want, their opinion of you is irrelevant."
    },
    {
        id: "wr-65",
        topic: "Communication",
        hook: "Be interested, not interesting.",
        caption: "The most charismatic people aren't the ones who tell the best stories. They are the ones who ask the best questions."
    },
    {
        id: "wr-66",
        topic: "Mental Health",
        hook: "You don't have to monetize your hobbies.",
        caption: "It's okay to do something just because it brings you joy. Not every passion requires a business plan."
    },
    {
        id: "wr-67",
        topic: "Decision Fatigue",
        hook: "The 'Hell Yes' or 'No' Rule.",
        caption: "If you feel lukewarm about a commitment, the answer is no. Guard your time relentlessly."
    },
    {
        id: "wr-68",
        topic: "Sleep",
        hook: "Sun exposure sets your clock.",
        caption: "Getting 10 minutes of direct sunlight into your eyes immediately after waking up dramatically improves your sleep at night."
    },
    {
        id: "wr-69",
        topic: "Confidence",
        hook: "No one knows what they are doing.",
        caption: "Even the experts are winging it at some level. Stop assuming everyone else has a secret manual you missed to read."
    },
    {
        id: "wr-70",
        topic: "Self Care",
        hook: "Forgive your past self.",
        caption: "They made the best decisions they could with the information and emotional tools they had at the time."
    },
    {
        id: "wr-71",
        topic: "Habits",
        hook: "The 2-Day Rule.",
        caption: "You can skip a day of your new habit, but never skip two days in a row. It prevents a slip from becoming a slide."
    },
    {
        id: "wr-72",
        topic: "Mindfulness",
        hook: "Wash the dishes just to wash the dishes.",
        caption: "Stop treating the present moment as a stepping stone to the next moment. Find peace in the mundane."
    },
    {
        id: "wr-73",
        topic: "Relationships",
        hook: "Love is an action, not a feeling.",
        caption: "The feeling fluctuates. The action of choosing your partner and treating them with respect is what sustains a relationship."
    },
    {
        id: "wr-74",
        topic: "Overwhelm",
        hook: "Start with the disaster zone.",
        caption: "When cleaning a messy room, don't focus on the whole thing. Focus on clearing one single surface."
    },
    {
        id: "wr-75",
        topic: "Career",
        hook: "You are replaceable at work.",
        caption: "You are not replaceable to your family, your friends, or yourself. Prioritize accordingly."
    },
    {
        id: "wr-76",
        topic: "Social",
        hook: "Pause for 2 seconds.",
        caption: "Before responding to someone, pause for two seconds. It shows you are actually thinking about their words, not just reacting."
    },
    {
        id: "wr-77",
        topic: "Discipline",
        hook: "Act the way you want to feel.",
        caption: "If you wait to 'feel' productive, you'll wait forever. Start acting productive, and the feelings of productivity will follow."
    },
    {
        id: "wr-78",
        topic: "Perspective",
        hook: "Stop agonizing over the 'right' choice.",
        caption: "There is rarely a perfect path. Just make a choice, and then put your energy into making that choice work."
    },
    {
        id: "wr-79",
        topic: "Mental Health",
        hook: "Do something badly.",
        caption: "Perfectionism paralyzes us. Give yourself permission to do a terrible job. A terrible job is infinitely better than nothing."
    },
    {
        id: "wr-80",
        topic: "Rest",
        hook: "Scrolling is not resting.",
        caption: "Staring at highly stimulating, fast-paced content drains your brain. True rest is low-stimulation: walking, napping, reading."
    },
    {
        id: "wr-81",
        topic: "Energy",
        hook: "Notice who drains you.",
        caption: "Pay attention to how you feel after hanging out with certain people. Protect your energy from chronic complainers."
    },
    {
        id: "wr-82",
        topic: "Focus",
        hook: "Turn your phone screen grayscale.",
        caption: "Without the bright, candy-colored notification badges, your brain will find the screen far less addictive."
    },
    {
        id: "wr-83",
        topic: "Anxiety",
        hook: "You are not your thoughts.",
        caption: "Thoughts are just weather passing through the mind. You are the sky. You don't have to react to every cloud."
    },
    {
        id: "wr-84",
        topic: "Communication",
        hook: "Praise publicly, criticize privately.",
        caption: "Never correct someone or point out a flaw in front of an audience. It guarantees defensiveness and destroys trust."
    },
    {
        id: "wr-85",
        topic: "Progress",
        hook: "The 1% better rule.",
        caption: "Improving by just 1% every day compounds to being 37 times better by the end of the year. Small consistently beats big occasionally."
    },
    {
        id: "wr-86",
        topic: "Anger",
        hook: "The 90-Second Rule.",
        caption: "When triggered, the chemical rush of anger only lasts 90 seconds. If you're still mad after that, it's because you are choosing to loop the thought."
    },
    {
        id: "wr-87",
        topic: "Regret",
        hook: "Will I regret NOT doing this?",
        caption: "When facing a scary opportunity, project yourself to age 80. Will 80-year-old you regret playing it safe?"
    },
    {
        id: "wr-88",
        topic: "Self Care",
        hook: "Say no to the request, not the person.",
        caption: "'I can't take this on right now, but I would love to catch up over coffee next week.' Protects your time, preserves the bond."
    },
    {
        id: "wr-89",
        topic: "Loneliness",
        hook: "Volunteer your time.",
        caption: "The fastest way to pull yourself out of a depressive, lonely spiral is to be of service to someone else who needs help."
    },
    {
        id: "wr-90",
        topic: "Success",
        hook: "Redefine success.",
        caption: "If success to you means 'peace of mind' rather than 'more money', your daily decisions will change drastically."
    },
    {
        id: "wr-91",
        topic: "Sleep",
        hook: "The brain temperature dump.",
        caption: "Taking a hot bath an hour before bed pulls blood to your skin, which actually drops your core body temperature—triggering sleep."
    },
    {
        id: "wr-92",
        topic: "Anxiety",
        hook: "Is this a tiger or a stick?",
        caption: "Your amygdala reacts to an angry email the same way it reacts to a predator. Remind your brain: 'I am safe. This is just a stick.'"
    },
    {
        id: "wr-93",
        topic: "Routine",
        hook: "Protect the first hour.",
        caption: "Win the first hour of the day, and you win the day. Avoid emails, news, and stressful inputs before you are fully awake."
    },
    {
        id: "wr-94",
        topic: "Self Worth",
        hook: "You don't have to earn rest.",
        caption: "Rest is a biological requirement, not a reward for being hyper-productive. Take the break guilt-free."
    },
    {
        id: "wr-95",
        topic: "Growth",
        hook: "Unsubscribe from negativity.",
        caption: "Audit your social media feed. If an account makes you feel insecure, anxious, or angry, unfollow immediately. Guard your inputs."
    },
    {
        id: "wr-96",
        topic: "Communication",
        hook: "'Tell me more about that.'",
        caption: "When someone is upset, don't offer solutions right away. Use this phrase. Let them empty their cup before you try to fill it."
    },
    {
        id: "wr-97",
        topic: "Focus",
        hook: "Headphones equal focus.",
        caption: "Even if you aren't listening to anything, wearing over-ear headphones acts as a universal 'do not disturb' sign in shared spaces."
    },
    {
        id: "wr-98",
        topic: "Resilience",
        hook: "What is the lesson?",
        caption: "Every failure carries a lesson wrapped in pain. Extract the lesson, discard the pain, and apply it to the next attempt."
    },
    {
        id: "wr-99",
        topic: "Habits",
        hook: "The path of least resistance.",
        caption: "Put your gym clothes on your floor the night before. Put your guitar on a stand, not in a case. Make good choices frictionless."
    },
    {
        id: "wr-100",
        topic: "Mindset",
        hook: "Be kind to your future self.",
        caption: "Do the dishes tonight so tomorrow-you wakes up to a clean kitchen. Small acts of self-love compound over time."
    }
];
