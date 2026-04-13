// ============================================================
// HEALTH HERO – 50 Level Learning Game
// ============================================================

const TIMER_DURATION = 30;
const LEVEL_SIZE     = 10;
const POINTS_BASE    = 100;
const CIRCUMFERENCE  = 2 * Math.PI * 44;

// ─── Seen Questions Logic ────────────────────────────────────
let seenQuestions = JSON.parse(localStorage.getItem('hht_seen_questions') || '[]');

// ─── QUESTION BANK ───────────────────────────────────────────
const BANK = {

    nutrition: [
        { q:'Which macronutrient is the body\'s primary source of energy?', a:'Protein', b:'Fat', c:'Carbohydrates', d:'Fiber', ans:'c', explain:'Carbohydrates are broken down into glucose, the body\'s main and preferred energy source.' },
        { q:'Which of these fats is considered "heart-healthy"?', a:'Trans fat', b:'Saturated fat', c:'Unsaturated fat', d:'Cholesterol', ans:'c', explain:'Unsaturated fats (like olive oil and avocados) reduce bad cholesterol levels and lower the risk of heart disease.' },
        { q:'How much water is recommended daily for an average adult?', a:'2-3 Liters', b:'1 Liter', c:'4-5 Liters', d:'500 mL', ans:'a', explain:'Adults roughly need 2 to 3 liters (8-10 glasses) of fluid daily to maintain optimal hydration.' },
        { q:'What is the primary function of protein in the body?', a:'Immediate energy', b:'Repair and build tissues', c:'Store vitamins', d:'Insulate organs', ans:'b', explain:'Proteins are the building blocks of life, essential for repairing muscles, skin, bones, and making hormones.' },
        { q:'Which food is the highest natural source of dietary fiber?', a:'Cheese', b:'Eggs', c:'Lentils', d:'Beef', ans:'c', explain:'Legumes like lentils are incredibly rich in fiber, which aids digestion and stabilizes blood sugar.' },
        { q:'What nutrient is most associated with building strong bones?', a:'Iron', b:'Calcium', c:'Omega-3', d:'Sodium', ans:'b', explain:'Calcium is a key mineral for bone density. Pairing it with Vitamin D increases its absorption.' },
        { q:'Which of the following is a complex carbohydrate?', a:'Table sugar', b:'Honey', c:'Oatmeal', d:'Fruit juice', ans:'c', explain:'Oatmeal is a complex carb, providing long-lasting energy by digesting slowly, unlike simple sugars.' },
        { q:'What does the Glycemic Index (GI) measure?', a:'Fat content', b:'How food affects blood sugar', c:'Salt levels', d:'Protein quality', ans:'b', explain:'GI measures how quickly foods raise blood glucose levels. Low GI foods prevent sugar spikes.' },
        { q:'What is an empty-calorie food?', a:'Food with no calories', b:'Food high in calories but low in nutrients', c:'Zero-sugar food', d:'Raw vegetables', ans:'b', explain:'Empty calories come from added sugars and solid fats, offering very little, if any, nutritional value.' },
        { q:'Which diet focuses on olive oil, nuts, fish, and whole grains?', a:'Keto Diet', b:'Paleo Diet', c:'Mediterranean Diet', d:'Vegan Diet', ans:'c', explain:'The Mediterranean Diet is widely considered one of the healthiest, reducing cardiovascular disease risks.' },
        { q:'What percentage of the human body is typically made of water?', a:'30-40%', b:'40-50%', c:'50-65%', d:'70-85%', ans:'c', explain:'Depending on age and gender, water comprises 50% to 65% of an adult body\'s weight.' },
        { q:'Which vegetable is an excellent source of iron?', a:'Cucumbers', b:'Carrots', c:'Spinach', d:'Onions', ans:'c', explain:'Spinach provides a great plant-based source of iron, which helps transport oxygen in the blood.' },
        { q:'What constitutes a "balanced" plate according to guidelines?', a:'Half meat, half carbs', b:'Half fruits/vegetables, quarter protein, quarter carbs', c:'Mostly dairy and protein', d:'Mostly fruit', ans:'b', explain:'Fill half your plate with colorful veggies/fruits to ensure you get vital vitamins and fiber.' },
        { q:'Which of these contains the highest amount of probiotics?', a:'White bread', b:'Apple', c:'Yogurt', d:'Chicken', ans:'c', explain:'Probiotics in yogurt are live beneficial bacteria that support a healthy gut microbiome.' },
        { q:'What is the healthiest way to cook vegetables?', a:'Deep frying', b:'Boiling for hours', c:'Steaming', d:'Microwaving in lots of oil', ans:'c', explain:'Steaming preserves most of the water-soluble vitamins that are often lost during boiling.' },
        { q:'What happens if you consume too much sodium?', a:'Lower blood pressure', b:'Higher blood pressure', c:'Better vision', d:'Stronger bones', ans:'b', explain:'Excess sodium causes your body to hold onto water, putting extra strain on your blood vessels.' },
        { q:'Which nut is known for having the highest amount of Omega-3 fatty acids?', a:'Peanuts', b:'Cashews', c:'Walnuts', d:'Pistachios', ans:'c', explain:'Walnuts are an excellent plant-based source of Omega-3s, which are great for brain health.' },
        { q:'Lactose is a type of sugar naturally found in what?', a:'Fruit', b:'Milk', c:'Wheat', d:'Meat', ans:'b', explain:'Lactose is the primary sugar in milk and dairy products. Some people lack the enzyme to digest it.' },
        { q:'Which mineral helps prevent muscle cramps?', a:'Iron', b:'Zinc', c:'Potassium', d:'Copper', ans:'c', explain:'Potassium (found abundantly in bananas and potatoes) is essential for muscle contraction and cramp prevention.' },
        { q:'What is a good natural alternative to refined white sugar?', a:'High Fructose Corn Syrup', b:'Brown Sugar', c:'Aspartame', d:'Honey or Maple Syrup', ans:'d', explain:'While still sugar, honey and maple syrup contain trace minerals and antioxidants missing from refined sugar.' },
        { q:'What characterizes a "whole grain"?', a:'It is ground into fine powder', b:'It contains the bran, germ, and endosperm', c:'It is bleached white', d:'It is artificially enriched', ans:'b', explain:'Whole grains keep all three parts of the grain, providing far more fiber and nutrients than refined grains.' },
        { q:'Anti-oxidants are crucial for diet because they...', a:'Make you gain weight', b:'Neutralize harmful free radicals', c:'Bleach your teeth', d:'Increase sugar levels', ans:'b', explain:'Antioxidants (like Vitamin C and E) protect your cells against oxidative stress and damage.' },
        { q:'Which of these is a symptom of severe dehydration?', a:'Clear urine', b:'Frequent sweating', c:'Dizziness and confusion', d:'Excessive energy', ans:'c', explain:'When you lose too much water, blood volume drops, leading to poor oxygen supply to the brain.' },
        { q:'Are all processed foods unhealthy?', a:'Yes, entirely', b:'No, some are minimally processed (like frozen veg)', c:'Only the canned ones', d:'Only the frozen ones', ans:'b', explain:'Minimal processing like freezing or canning (without added sugars/salts) can preserve nutrients well.' },
        { q:'Quinoa is unique among plant foods because...', a:'It is totally carbohydrate-free', b:'It has zero fat', c:'It is a complete protein', d:'It is poisonous raw', ans:'c', explain:'Quinoa contains all 9 essential amino acids, making it a "complete protein" rare in the plant world.' },
        { q:'Consuming too much added sugar increases the risk of...', a:'Type 2 Diabetes', b:'Type 1 Diabetes', c:'Lactose intolerance', d:'Scurvy', ans:'a', explain:'High sugar intake leads to weight gain and insulin resistance, primary drivers for Type 2 Diabetes.' },
        { q:'What is a "macro"?', a:'A type of computer virus', b:'Macronutrients (Carbs, Fats, Proteins)', c:'A large meal', d:'A vitamin supplement', ans:'b', explain:'Macros are the nutrients you use in the largest amounts that provide calories and energy.' },
        { q:'Which cooking oil is best for high-heat frying?', a:'Extra Virgin Olive Oil', b:'Avocado Oil', c:'Flaxseed Oil', d:'Butter', ans:'b', explain:'Avocado oil has a very high smoke point, meaning it won\'t break down and release harmful free radicals at high temps.' },
        { q:'If a product says "0g Trans Fat", it might still have up to...', a:'0.5g per serving', b:'1.0g per serving', c:'2.0g per serving', d:'None at all', ans:'a', explain:'Food labeling laws allow items with less than 0.5g of trans fat per serving to be listed as 0g.' },
        { q:'Caffeine is classified as a...', a:'Depressant', b:'Stimulant', c:'Hallucinogen', d:'Vitamin', ans:'b', explain:'Caffeine stimulates the central nervous system, reducing fatigue and increasing alertness temporarily.' },
        { q:'Fibers that dissolve in water to form a gel-like material are called...', a:'Insoluble fiber', b:'Soluble fiber', c:'Dietary fiber', d:'Crude fiber', ans:'b', explain:'Soluble fiber (found in oats and apples) helps lower blood cholesterol and glucose levels.' },
        { q:'What does the body convert unused carbohydrates into for storage?', a:'Protein', b:'Water', c:'Glycogen and Fat', d:'Calcium', ans:'c', explain:'Excess carbs are stored as glycogen in muscles and the liver, and the rest is converted to fat.' }
    ],

    sleep: [
        { q:'What is the recommended hours of sleep for an adult?', a:'4-5 hours', b:'6-7 hours', c:'7-9 hours', d:'9-11 hours', ans:'c', explain:'Most adults need 7-9 hours of consistent sleep for cognitive function and physical recovery.' },
        { q:'Which hormone is primarily responsible for regulating sleep?', a:'Adrenaline', b:'Cortisol', c:'Melatonin', d:'Insulin', ans:'c', explain:'Melatonin is released in the brain largely in response to darkness, signaling that it is time to sleep.' },
        { q:'What does "Blue Light" from screens do to your sleep?', a:'Helps you sleep faster', b:'Suppresses melatonin production', c:'Increases deep sleep', d:'No effect', ans:'b', explain:'Blue light mimics daylight, tricking your brain into staying awake by blocking melatonin release.' },
        { q:'What happens during REM sleep?', a:'Heart rate drops', b:'Muscles become fully paralyzed while you dream', c:'Body temperature drops', d:'Digestion stops', ans:'b', explain:'REM (Rapid Eye Movement) sleep is when vivid dreaming happens; your muscles paralyze to prevent acting out dreams.' },
        { q:'A consistent sleep schedule means...', a:'Sleeping only when tired', b:'Waking up and going to bed at the same times every day', c:'Sleeping 12 hours on weekends', d:'Taking multiple naps', ans:'b', explain:'Regular sleep times regulate your circadian rhythm, making it easier to fall asleep and wake up.' },
        { q:'What is the ideal bedroom environment for sleeping?', a:'Bright and warm', b:'Cool, dark, and quiet', c:'Warm with the TV on', d:'Cold and brightly lit', ans:'b', explain:'A cool room (around 65°F/18°C) in complete darkness signals to the body that it’s time for deep rest.' },
        { q:'When is the best time to stop consuming caffeine before bed?', a:'1 hour before', b:'3 hours before', c:'At least 6-8 hours before', d:'Just before bed', ans:'c', explain:'Caffeine has a half-life of 5 hours, meaning it can keep your brain alert long after drinking it.' },
        { q:'Which of these is a symptom of Sleep Apnea?', a:'Vivid dreams', b:'Loud snoring and gasping for air', c:'Sleepwalking', d:'Talking in sleep', ans:'b', explain:'Sleep apnea causes breathing to repeatedly stop and start, significantly disrupting sleep quality.' },
        { q:'How do large meals right before bed affect sleep?', a:'They improve deep sleep', b:'They can cause indigestion and disrupt sleep', c:'They increase melatonin', d:'They have no effect', ans:'b', explain:'Eating heavily before bed triggers digestion and can lead to acid reflux when you lie down.' },
        { q:'What is the term for a short sleep period during the day?', a:'Siesta/Nap', b:'Coma', c:'Insomnia', d:'Lethargy', ans:'a', explain:'A short power nap (20-30 minutes) can boost alertness without causing grogginess.' },
        { q:'What role does physical exercise play in sleep hygiene?', a:'Makes sleep worse', b:'Helps you fall asleep faster and deepens sleep', c:'Causes insomnia', d:'Stops REM sleep', ans:'b', explain:'Regular exercise tires the body and reduces stress, leading to deeper, more restorative sleep.' },
        { q:'What is "Sleep Debt"?', a:'Paying for a new mattress', b:'The cumulative effect of not getting enough sleep', c:'Sleeping too much', d:'Napping repeatedly', ans:'b', explain:'Accumulated lost sleep can lead to chronic fatigue, impaired focus, and weakened immunity.' },
        { q:'Which age group generally needs the most sleep?', a:'Seniors', b:'Adults', c:'Teenagers', d:'Infants', ans:'d', explain:'Infants need up to 14-17 hours of sleep a day for rapid brain and physical development.' },
        { q:'Drinking alcohol before bed typically causes...', a:'Better REM sleep', b:'Fragmented sleep and reduced REM', c:'No effect', d:'More vivid dreams', ans:'b', explain:'While alcohol might make you drowsy initially, it severely disrupts the restorative REM sleep phase.' },
        { q:'What is a good pre-sleep relaxation technique?', a:'Reading a book or meditating', b:'Playing intense video games', c:'High-intensity workout', d:'Arguing', ans:'a', explain:'Calming activities lower your heart rate and signal to your brain that it is time to wind down.' },
        { q:'What is Insomnia?', a:'Sleeping too much', b:'Inability to fall or stay asleep', c:'Sleepwalking', d:'Dreaming while awake', ans:'b', explain:'Insomnia is a common sleep disorder that can make it hard to fall asleep, hard to stay asleep, or cause you to wake up too early.' },
        { q:'What does the "circadian rhythm" refer to?', a:'Your heart rate', b:'The body\'s internal 24-hour clock', c:'Your breathing speed', d:'A type of running rhythm', ans:'b', explain:'The circadian rhythm regulates your sleep-wake cycle based largely on light-dark cues from your environment.' },
        { q:'If you can\'t fall asleep after 20 minutes in bed, you should...', a:'Keep tossing and turning', b:'Look at your phone', c:'Get up and do a quiet, dim-light activity', d:'Do pushups', ans:'c', explain:'Staying in bed awake can create anxiety. Doing a quiet activity until you feel tired resets your brain.' },
        { q:'How does room temperature affect sleep?', a:'Hotter is better', b:'Colder is better (around 65°F/18°C)', c:'Room temperature has no effect', d:'Fluctuating is best', ans:'b', explain:'Your body temperature naturally drops as you fall asleep; a cool room helps signal to the body that it is time for rest.' },
        { q:'Which stage of sleep is most important for physical restoration and tissue repair?', a:'Light sleep', b:'REM sleep', c:'Deep sleep (Slow-wave)', d:'Waking up', ans:'c', explain:'Deep sleep is when blood pressure drops, breathing slows, and the body repairs muscles and tissues.' },
        { q:'What is "Microsleep"?', a:'Sleeping for exactly one hour', b:'Brief sleep episodes lasting seconds', c:'Sleeping while standing', d:'A tiny bed', ans:'b', explain:'Microsleep occurs when the brain is so deprived of sleep it forces brief moments of unconsciousness, which is highly dangerous when driving.' },
        { q:'Which is a known negative effect of chronic sleep deprivation?', a:'Improved memory', b:'Weight loss', c:'Increased risk of heart disease', d:'Better vision', ans:'c', explain:'Lack of sleep causes high stress levels and inflammation, drastically escalating heart disease and stroke risks.' },
        { q:'Narcolepsy is characterized by...', a:'Inability to sleep', b:'Overwhelming daytime drowsiness and sudden sleep attacks', c:'Sleepwalking', d:'Night terrors', ans:'b', explain:'People with narcolepsy find it difficult to stay awake for long periods, regardless of circumstances.' },
        { q:'It is generally a bad idea to keep a clock facing you at night because...', a:'It emits radiation', b:'It causes "clock-watching" anxiety', c:'The ticking is too loud', d:'It wakes you up early', ans:'b', explain:'Continuously checking the time increases stress levels, making it harder to drift into sleep.' },
        { q:'Which of these smells is scientifically proven to promote relaxation and sleep?', a:'Peppermint', b:'Lemon', c:'Lavender', d:'Coffee', ans:'c', explain:'Lavender oil has been shown to decrease heart rate and blood pressure, potentially putting you in a more relaxed state.' },
        { q:'Having irregular sleep patterns heavily disrupts your...', a:'Digestion', b:'Circadian Rhythm', c:'Blood type', d:'Bone structure', ans:'b', explain:'Going to bed and waking up at drastically different times confuses the body\'s internal clock, throwing off hormone release.' },
        { q:'True or False: Snoring is always harmless.', a:'True', b:'False', c:'Only for adults', d:'Only for kids', ans:'b', explain:'While common, loud and chronic snoring can be a sign of sleep apnea, a serious condition requiring medical attention.' },
        { q:'Using a "White Noise" machine helps by...', a:'Talking to you', b:'Masking disruptive background noises', c:'Creating blue light', d:'Lowering room temp', ans:'b', explain:'White noise provides a consistent audio backdrop that drowns out sudden spikes in sound like a dog barking or a car passing.' },
        { q:'What effect does nicotine have on sleep?', a:'It relaxes you and improves sleep', b:'It is a stimulant and disrupts sleep quality', c:'It has no effect', d:'It causes immediate REM', ans:'b', explain:'Although smokers may feel relaxed, nicotine is a stimulant that increases heart rate and brain activity, making sleep difficult.' },
        { q:'Should you exercise vigorously right before bed?', a:'Yes, it exhausts you', b:'No, it raises your heart rate and core temperature', c:'Only if you are young', d:'It makes no difference', ans:'b', explain:'Vigorous exercise right before bed can over-stimulate your nervous system. Gentle yoga or stretching is much better.' }
    ],

    first_aid: [
        { q:'For an adult CPR, what is the correct compression-to-breath ratio?', a:'15:2', b:'30:2', c:'50:2', d:'5:1', ans:'b', explain:'Push hard and fast: 30 compressions in the center of the chest, followed by 2 rescue breaths.' },
        { q:'What is the first step when you encounter an emergency situation?', a:'Start CPR immediately', b:'Check the scene for safety', c:'Call the person\'s family', d:'Give them water', ans:'b', explain:'Never put yourself in danger. Always check if the environment is safe before assisting the victim.' },
        { q:'How should you treat a minor burn?', a:'Apply ice directly', b:'Apply butter or oil', c:'Run cool (not freezing) water over it for 10-15 minutes', d:'Pop the blisters', ans:'c', explain:'Cool water stops the burning process. Ice or butter can cause further tissue damage.' },
        { q:'What is the Heimlich Maneuver used for?', a:'Heart attacks', b:'Choking', c:'Drowning', d:'Bleeding', ans:'b', explain:'It involves abdominal thrusts under the ribcage to force a blocked object out of the airway.' },
        { q:'When someone is having a seizure, you should...', a:'Hold them down', b:'Put a spoon in their mouth', c:'Clear the area of hard objects and protect their head', d:'Splash water on them', ans:'c', explain:'Never restrain someone having a seizure or put anything in their mouth. Just keep them safe from injury.' },
        { q:'To stop severe external bleeding, the first action is to:', a:'Apply a tourniquet immediately', b:'Apply direct pressure with a clean cloth', c:'Elevate the leg and do nothing', d:'Wash it with soap', ans:'b', explain:'Firm, direct pressure over a wound is the most effective way to stop typical bleeding.' },
        { q:'What does the acronym "AED" stand for?', a:'Automated External Defibrillator', b:'Advanced Emergency Device', c:'Automatic Electric Doctor', d:'Acute Energy Discharge', ans:'a', explain:'An AED analyzes the heart rhythm and can deliver an electric shock to restore a normal heartbeat.' },
        { q:'How do you treat a suspected broken bone?', a:'Try to push it back into place', b:'Immobilize the area and seek medical help', c:'Massage the area', d:'Have them walk on it', ans:'b', explain:'Never try to realign a bone yourself. Keep the injured limb as still as possible.' },
        { q:'What is the first aid for a nosebleed?', a:'Tilt head back', b:'Lie down flat', c:'Pinch the soft part of the nose and lean slightly forward', d:'Blow your nose forcefully', ans:'c', explain:'Leaning forward prevents swallowing blood, which can irritate the stomach and cause vomiting.' },
        { q:'What does "R.I.C.E." stand for in injury treatment?', a:'Rest, Ice, Compression, Elevation', b:'Run, Inspect, Call, Evacuate', c:'Roll, Injure, Care, Endure', d:'Rest, Ingest, Cure, Elevate', ans:'a', explain:'RICE is the standard treatment for sprains and strains to reduce swelling and pain.' },
        { q:'If someone shows signs of a stroke, what acronym helps you remember what to do?', a:'F.A.S.T.', b:'S.A.F.E.', c:'S.T.O.P.', d:'H.E.L.P.', ans:'a', explain:'Face drooping, Arm weakness, Speech difficulty, Time to call emergency.' },
        { q:'What is the immediate treatment for a bee sting if the stinger is left in?', a:'Squeeze it out', b:'Scrape it away with a flat edge (like a credit card)', c:'Leave it in', d:'Put a warm cloth on it', ans:'b', explain:'Squeezing the stinger can push more venom into the skin. Scraping it off is safer.' },
        { q:'What should you do if someone faints and then wakes up quickly?', a:'Have them stand up immediately', b:'Keep them lying down with legs elevated', c:'Give them strong coffee', d:'Slap their face', ans:'b', explain:'Elevating the legs helps restore blood flow to the brain after a fainting episode.' },
        { q:'Which item is essential in a basic home first-aid kit?', a:'Antibiotics', b:'Sterile gauze pads and bandages', c:'Sutures/Stitches', d:'Scalpel', ans:'b', explain:'Gauze and bandages are vital for controlling bleeding and protecting wounds from infection.' },
        { q:'If someone has swallowed a toxic chemical, what should you do first?', a:'Make them vomit', b:'Call Poison Control or emergency services immediately', c:'Give them milk', d:'Give them water', ans:'b', explain:'Never induce vomiting unless instructed by a medical professional, as it can cause more damage on the way up.' },
        { q:'What is Anaphylaxis?', a:'A minor skin rash', b:'A severe, potentially life-threatening allergic reaction', c:'A type of bone fracture', d:'High blood pressure', ans:'b', explain:'Anaphylaxis occurs rapidly after exposure to an allergen (like peanuts or bee stings) and requires an immediate Epinephrine injection.' },
        { q:'When approaching a victim who is unresponsive, how do you check for breathing?', a:'Look, listen, and feel for no more than 10 seconds', b:'Listen for 2 minutes', c:'Shake them violently', d:'Check their pulse only', ans:'a', explain:'Check quickly. Look for chest rise, listen for air escaping, and feel for breath on your cheek.' },
        { q:'What is the proper depth for chest compressions on an adult during CPR?', a:'About 1 inch', b:'At least 2 inches (5cm)', c:'4 inches', d:'Half an inch', ans:'b', explain:'Compressions must be at least 2 inches deep to adequately pump blood out of the heart and to the brain.' },
        { q:'If a person is choking but can still cough forcefully, you should:', a:'Perform the Heimlich maneuver', b:'Give them water', c:'Encourage them to keep coughing', d:'Slap their back', ans:'c', explain:'A strong cough means they still have some airway open. A back slap might lodge the object deeper.' },
        { q:'What should you do for a person experiencing shock?', a:'Make them run around', b:'Keep them warm and elevate their legs', c:'Give them alcohol to warm up', d:'Wait until they pass out', ans:'b', explain:'Shock usually means low blood pressure. Elevating legs pushes blood to vital organs, and a blanket prevents heat loss.' },
        { q:'If someone knocks out a permanent adult tooth, what should you do with the tooth?', a:'Throw it away', b:'Store it in milk or saliva and go to the dentist immediately', c:'Wash it with soap and hot water', d:'Put it in dry tissue', ans:'b', explain:'Milk or saliva helps preserve the root cells for potential re-implantation. Never scrub the root.' },
        { q:'When using an AED, the first step is to:', a:'Attach the pads', b:'Press the shock button', c:'Turn it on', d:'Listen for a heartbeat', ans:'c', explain:'Always turn the AED on first. It will verbally guide you through every subsequent step.' },
        { q:'How do you recognize a second-degree burn?', a:'Redness only', b:'Blistering and severe pain', c:'Charred, black skin', d:'No pain at all', ans:'b', explain:'Second-degree burns damage the outer and underlying layer of skin, producing large, painful blisters.' },
        { q:'If a person has a suspected spinal injury, you should:', a:'Drag them to comfort', b:'Not move them unless they are in immediate danger', c:'Have them sit up', d:'Turn their head side to side', ans:'b', explain:'Moving someone with a spinal injury can cause permanent paralysis. Support the head and wait for EMS.' },
        { q:'What is "Hypothermia"?', a:'Dangerous rise in body temperature', b:'Dangerous drop in core body temperature', c:'Lack of blood', d:'Too much oxygen', ans:'b', explain:'Hypothermia occurs when your body loses heat faster than it can produce it, usually due to cold exposure.' },
        { q:'In the case of a severe asthma attack, you should:', a:'Help them use their prescribed inhaler', b:'Make them lie flat on their back', c:'Have them breathe into a paper bag', d:'Give them a glass of milk', ans:'a', explain:'A prescribed rescue inhaler opens the airways. Lying flat makes it harder to breathe during an attack.' },
        { q:'What is a Tourniquet used for?', a:'Small cuts', b:'Life-threatening bleeding from a limb', c:'Head wounds', d:'Burns', ans:'b', explain:'A tourniquet is a tight band used to completely stop arterial blood flow when direct pressure fails.' },
        { q:'If a diabetic person is experiencing hypoglycemia (low blood sugar), you should:', a:'Give them insulin', b:'Give them sugary food or juice', c:'Give them nothing', d:'Make them sleep', ans:'b', explain:'Low blood sugar requires fast-acting carbohydrates (like juice or sugar packets) to prevent fainting or seizures.' },
        { q:'For an infant choking, what method is used instead of the standard Heimlich maneuver?', a:'Abdominal thrusts', b:'5 back blows and 5 chest thrusts', c:'Hold them upside down', d:'Give them a drink', ans:'b', explain:'An infant\'s organs are fragile. Back blows and chest thrusts are standard to dislodge the object safely.' },
        { q:'Which of the following is a sign of heat stroke?', a:'Heavy sweating', b:'Cold, clammy skin', c:'Hot, red, dry skin and confusion', d:'Shivering', ans:'c', explain:'Heat stroke is a medical emergency where the body stops sweating and overheats dramatically.' }
    ],

    vitamins: [
        { q:'Which vitamin is also known as the "Sunshine Vitamin"?', a:'Vitamin A', b:'Vitamin B12', c:'Vitamin C', d:'Vitamin D', ans:'d', explain:'Your skin produces Vitamin D when exposed to sunlight. It is crucial for bone health.' },
        { q:'A deficiency in Vitamin C can lead to which disease?', a:'Rickets', b:'Scurvy', c:'Anemia', d:'Pellagra', ans:'b', explain:'Scurvy causes bleeding gums and weakness, historically common among sailors without access to fresh fruit.' },
        { q:'Which fruit is famous for its high Vitamin C content?', a:'Banana', b:'Orange', c:'Apple', d:'Grapes', ans:'b', explain:'Citrus fruits are packed with Vitamin C, an antioxidant that boosts the immune system.' },
        { q:'Which vitamin is crucial for maintaining good vision?', a:'Vitamin A', b:'Vitamin K', c:'Vitamin E', d:'Vitamin B6', ans:'a', explain:'Vitamin A (found in carrots) protects the cornea and is essential for low-light vision.' },
        { q:'What is the primary role of Vitamin K in the body?', a:'Energy production', b:'Blood clotting', c:'Hair growth', d:'Skin repair', ans:'b', explain:'Vitamin K allows blood to coagulate, preventing excessive bleeding from cuts.' },
        { q:'Vitamin B12 is mainly found in which type of food?', a:'Fruits', b:'Vegetables', c:'Animal products (meat, dairy)', d:'Grains', ans:'c', explain:'Vegans often need supplements because B12, vital for nerve function, is naturally found almost exclusively in animal products.' },
        { q:'Which mineral works closely with Vitamin D to build bones?', a:'Iron', b:'Zinc', c:'Calcium', d:'Potassium', ans:'c', explain:'Vitamin D helps your gut absorb Calcium, making them the perfect team for a strong skeleton.' },
        { q:'Vitamin E is known primarily as an...', a:'Acid', b:'Antioxidant', c:'Antibiotic', d:'Amino Acid', ans:'b', explain:'Antioxidants like Vitamin E protect your cells from damage caused by free radicals.' },
        { q:'Which group of vitamins is responsible for turning food into energy?', a:'B-Complex Vitamins', b:'Fat-soluble Vitamins', c:'Vitamin C', d:'Vitamin A', ans:'a', explain:'B vitamins (B1, B2, B3, etc.) act as coenzymes that help enzymes release energy from carbs and fats.' },
        { q:'Folic Acid (Vitamin B9) is extremely important during...', a:'Old age', b:'Pregnancy', c:'Sleep', d:'Exercise', ans:'b', explain:'Folic acid helps form the neural tube in fetuses, preventing major birth defects of the baby\'s brain and spine.' },
        { q:'Which of these is a FAT-soluble vitamin?', a:'Vitamin C', b:'Vitamin B1', c:'Vitamin D', d:'Vitamin B12', ans:'c', explain:'Vitamins A, D, E, and K are fat-soluble, meaning they are stored in the body\'s fatty tissue.' },
        { q:'Which vitamin can you get significantly from eating almonds and sunflower seeds?', a:'Vitamin E', b:'Vitamin C', c:'Vitamin B12', d:'Vitamin D', ans:'a', explain:'Nuts and seeds are fantastic natural sources of Vitamin E for healthy skin and eyes.' },
        { q:'A lack of Iron in the diet often leads to...', a:'Scurvy', b:'Anemia', c:'Night blindness', d:'Brittle bones', ans:'b', explain:'Iron is needed to make hemoglobin. Without it, you develop anemia, causing extreme fatigue.' },
        { q:'Which vitamin is produced by bacteria in your gut?', a:'Vitamin E', b:'Vitamin K', c:'Vitamin A', d:'Vitamin C', ans:'b', explain:'Alongside dietary sources (like spinach), the good bacteria in your intestines create a portion of your Vitamin K.' },
        { q:'What role does Potassium play in the body?', a:'Builds bones', b:'Helps muscles contract and regulates blood pressure', c:'Produces melatonin', d:'Creates white blood cells', ans:'b', explain:'Potassium (found in bananas) counters the effects of sodium, keeping blood pressure in check.' },
        { q:'Which vitamin deficiency causes Rickets in children?', a:'Vitamin C', b:'Vitamin A', c:'Vitamin D', d:'Vitamin K', ans:'c', explain:'Without Vitamin D, children cannot absorb calcium properly, leading to soft, easily deformable bones known as Rickets.' },
        { q:'What does "Water-Soluble" mean regarding vitamins like C and B?', a:'They are stored in fat', b:'They can dissolve in water and are excreted in urine', c:'They turn into water', d:'They only exist in liquids', ans:'b', explain:'Since water-soluble vitamins are not easily stored in the body, they must be consumed almost daily.' },
        { q:'Niacin is also known as which vitamin?', a:'Vitamin B1', b:'Vitamin B2', c:'Vitamin B3', d:'Vitamin B6', ans:'c', explain:'Niacin (B3) helps convert food to energy and is good for the nervous system. A deficiency causes pellagra.' },
        { q:'Which food is highly fortified with Vitamin D to prevent deficiency?', a:'Apples', b:'Potatoes', c:'Cow\'s Milk', d:'Chicken', ans:'c', explain:'Many dairy and plant milks are fortified with Vitamin D because it is hard to get enough from food naturally.' },
        { q:'Which trace mineral is essential for proper thyroid function?', a:'Fluoride', b:'Iodine', c:'Zinc', d:'Magnesium', ans:'b', explain:'The thyroid gland uses iodine to make hormones that control metabolism. Lack of it causes a goiter.' },
        { q:'Vitamin B1 is commonly known as...', a:'Thiamine', b:'Riboflavin', c:'Folic Acid', d:'Biotin', ans:'a', explain:'Thiamine helps cells change carbs into energy. Severe deficiency causes beriberi.' },
        { q:'Which vitamin plays a critical role in collagen synthesis?', a:'Vitamin A', b:'Vitamin C', c:'Vitamin K', d:'Vitamin D', ans:'b', explain:'Vitamin C is required to produce collagen, the protein that holds skin, bones, and tissues together.' },
        { q:'What is "Hypervitaminosis"?', a:'A lack of vitamins', b:'An abnormally high concentration of vitamins in the blood', c:'Allergies to vitamins', d:'A specific vitamin brand', ans:'b', explain:'Taking massive doses of fat-soluble vitamins (A, D, E, K) can be toxic because they build up in fat cells.' },
        { q:'Which mineral is most associated with building a strong immune system?', a:'Sodium', b:'Zinc', c:'Calcium', d:'Chloride', ans:'b', explain:'Zinc helps the immune system fight off invading bacteria and viruses, and aids in wound healing.' },
        { q:'What is a good source of Vitamin B2 (Riboflavin)?', a:'White sugar', b:'Eggs and lean meats', c:'Olive oil', d:'Apples', ans:'b', explain:'Meat, eggs, and dairy are excellent sources of Riboflavin, which breaks down proteins, fats, and carbs.' },
        { q:'Dark leafy greens like spinach are high in which vitamin that aids blood clotting?', a:'Vitamin C', b:'Vitamin K', c:'Vitamin D', d:'Vitamin B12', ans:'b', explain:'Spinach and kale are some of the richest natural sources of Vitamin K.' },
        { q:'Vitamin A is abundant in vegetables of what colors?', a:'White and light green', b:'Orange, yellow, and dark green', c:'Purple and black', d:'Red only', ans:'b', explain:'Beta-carotene (which converts to Vitamin A) naturally gives carrots, sweet potatoes, and pumpkins their vibrant orange color.' },
        { q:'What is a multivitamin?', a:'A vitamin found only in meat', b:'A supplement containing a combination of vitamins and minerals', c:'A naturally glowing vitamin', d:'A drink', ans:'b', explain:'Multivitamins act as dietary "insurance" to fill in nutritional gaps, though whole foods are preferable.' },
        { q:'A lack of which vitamin limits the body\'s ability to absorb calcium?', a:'Vitamin A', b:'Vitamin C', c:'Vitamin D', d:'Vitamin B1', ans:'c', explain:'Even if calcium is consumed, without adequate Vitamin D, the body cannot absorb it from the intestine.' },
        { q:'Biotin (Vitamin B7) is often marketed as a supplement for...', a:'Stronger bones', b:'Better eyesight', c:'Healthy hair, skin, and nails', d:'Weight loss', ans:'c', explain:'While deficiencies are rare, Biotin is essential for the metabolism of fats, carbs, and proteins, strongly impacting skin and hair strength.' }
    ]
};

// ─── Topic Display Names ───────────────────────────────────────
const TOPIC_LABELS = {
    nutrition: '🥗 Nutrition',
    sleep:     '😴 Sleep Hygiene',
    first_aid: '🚑 First Aid',
    vitamins:  '💊 Vitamins',
};

// ─── Multi-Level Progression (50 Levels) ────────────────────────
// Levels feature all topics progressively. We just pick random from all.
function getTopicsForLevel(level) {
    if (level <= 5) return ['nutrition', 'sleep'];
    if (level <= 10) return ['nutrition', 'first_aid', 'vitamins'];
    return Object.keys(BANK); 
}

function pickQuestion(level) {
    const topics = getTopicsForLevel(level);
    let available = [];
    
    topics.forEach(t => {
        BANK[t].forEach((q, idx) => {
            const qId = `${t}_${idx}`;
            if (!seenQuestions.includes(qId)) {
                available.push({ ...q, topic: t, id: qId });
            }
        });
    });

    if (available.length === 0) {
        // Reset seen questions if we exhausted the bank
        seenQuestions = [];
        localStorage.setItem('hht_seen_questions', JSON.stringify(seenQuestions));
        return pickQuestion(level);
    }

    const q = available[Math.floor(Math.random() * available.length)];
    seenQuestions.push(q.id);
    localStorage.setItem('hht_seen_questions', JSON.stringify(seenQuestions));
    return q;
}

// ─── State ───────────────────────────────────────────────────
let currentQ      = 0;
let level         = 1;
let score         = 0;
let correct       = 0;
let total         = 0;
let timerVal      = TIMER_DURATION;
let timerInterval = null;
let lifelineUsed  = { '5050':false, skip:false, double:false };
let doubleActive  = false;
let gameActive    = false;
let activeQuestion = null;

// ─── Audio ───────────────────────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, type, dur, vol=0.3) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = type; o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    o.start(); o.stop(audioCtx.currentTime + dur);
}
function playCorrect()  { beep(500,'sine',0.08); setTimeout(()=>beep(700,'sine',0.12),100); setTimeout(()=>beep(900,'sine',0.16),230); }
function playWrong()    { beep(180,'sawtooth',0.3); }
function playTick()     { beep(440,'sine',0.04,0.07); }
function playLevelUp()  { [400,600,800,1000,1300].forEach((f,i)=>setTimeout(()=>beep(f,'sine',0.2),i*90)); }

// ─── Timer ───────────────────────────────────────────────────
function startTimer() {
    clearInterval(timerInterval);
    timerVal = TIMER_DURATION;
    renderTimer();
    timerInterval = setInterval(() => {
        timerVal--;
        renderTimer();
        if (timerVal <= 10) playTick();
        if (timerVal <= 0)  { clearInterval(timerInterval); handleTimeOut(); }
    }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }
function renderTimer() {
    const arc = document.getElementById('timer-arc');
    const txt = document.getElementById('timer-text');
    arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - timerVal / TIMER_DURATION);
    txt.textContent = timerVal;
    arc.classList.toggle('warning', timerVal <= 10);
    txt.classList.toggle('warning', timerVal <= 10);
}
function handleTimeOut() {
    showToast("⏰ Time's Up!");
    disableOptions();
    if (activeQuestion) document.getElementById(`opt-${activeQuestion.ans.toUpperCase()}`).classList.add('correct');
    showExplanation(activeQuestion.explain);
    setTimeout(() => endGame(), 3000); // Wait longer so they read the takeaway
}

// ─── Load Question ────────────────────────────────────────────
function loadQuestion() {
    removeExplanation();
    activeQuestion = pickQuestion(level);
    const qNum = currentQ + 1;

    document.getElementById('level-display').textContent   = `Level ${level} · Q${qNum}`;
    document.getElementById('q-number').textContent        = `LEVEL ${level} — Q${qNum} of ${LEVEL_SIZE}`;
    document.getElementById('question-text').textContent   = activeQuestion.q;
    document.getElementById('topic-badge').textContent     = TOPIC_LABELS[activeQuestion.topic] || activeQuestion.topic;

    ['A','B','C','D'].forEach((letter, i) => {
        const key  = ['a','b','c','d'][i];
        const btn  = document.getElementById(`opt-${letter}`);
        const span = document.getElementById(`opt-${letter}-text`);
        btn.className = 'option-btn';
        btn.disabled  = false;
        span.textContent = activeQuestion[key];
        btn.querySelector('.opt-label').textContent = letter;
    });

    startTimer();
    const card = document.getElementById('question-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'popIn 0.4s ease';
}

// ─── Handle Answer ─────────────────────────────────────────────
function handleAnswer(chosen) {
    if (!gameActive) return;
    stopTimer();
    disableOptions();

    const selectedBtn = document.getElementById(`opt-${chosen.toUpperCase()}`);
    selectedBtn.classList.add('selected');

    setTimeout(() => {
        if (chosen === activeQuestion.ans) {
            // CORRECT
            selectedBtn.classList.remove('selected');
            selectedBtn.classList.add('correct');
            playCorrect();

            const flash = document.createElement('div'); flash.className='correct-flash'; document.body.appendChild(flash); setTimeout(()=>flash.remove(),700);

            const pts = POINTS_BASE * level * (doubleActive ? 2 : 1);
            score += pts; correct++; total++;
            doubleActive = false;
            showScorePopup(`+${pts}`);
            document.getElementById('score-val').textContent = score.toLocaleString();

            showExplanation(activeQuestion.explain);

            currentQ++;
            if (currentQ >= LEVEL_SIZE) {
                currentQ = 0; level++;
                resetLifelines();
                setTimeout(() => { removeExplanation(); showLevelUp(); }, 3500);
            } else {
                setTimeout(() => { removeExplanation(); loadQuestion(); }, 3500);
            }
        } else {
            // WRONG
            selectedBtn.classList.remove('selected');
            selectedBtn.classList.add('wrong');
            document.getElementById(`opt-${activeQuestion.ans.toUpperCase()}`).classList.add('correct');
            playWrong();
            total++;
            showExplanation(activeQuestion.explain);
            setTimeout(() => endGame(), 3500);
        }
    }, 400);
}

// ─── Level Up ─────────────────────────────────────────────────
function showLevelUp() {
    playLevelUp();
    showToast(`🎉 Level ${level-1} Complete! → Level ${level}`);
    if (level === 50) {
        showToast("🏆 You're approaching Master Level!");
    }
    setTimeout(loadQuestion, 1500);
}

// ─── Score Popup ──────────────────────────────────────────────
function showScorePopup(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:28%;left:50%;transform:translateX(-50%);font-size:2rem;font-weight:900;color:#34d399;text-shadow:0 0 20px rgba(16,185,129,0.8);pointer-events:none;z-index:500;animation:scoreFloat 1s ease forwards;';
    document.body.appendChild(el);
    if (!document.getElementById('sf-style')) {
        const s = document.createElement('style'); s.id='sf-style';
        s.textContent='@keyframes scoreFloat{0%{opacity:1;transform:translateX(-50%) translateY(0);}100%{opacity:0;transform:translateX(-50%) translateY(-60px);}}';
        document.head.appendChild(s);
    }
    setTimeout(() => el.remove(), 1000);
}

// ─── Explanation Box ──────────────────────────────────────────
function showExplanation(text) {
    removeExplanation();
    const el = document.createElement('div');
    el.id = 'explanation-box'; el.className = 'explanation-box';
    el.innerHTML = `💡 <strong>Healthy Takeaway:</strong> ${text}`;
    document.body.appendChild(el);
}
function removeExplanation() {
    document.getElementById('explanation-box')?.remove();
}

// ─── Lifelines ────────────────────────────────────────────────
function resetLifelines() {
    lifelineUsed = { '5050':false, skip:false, double:false };
    ['ll-5050','ll-skip','ll-double'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
    });
}
function use5050() {
    if (lifelineUsed['5050'] || !gameActive) return;
    lifelineUsed['5050'] = true;
    document.getElementById('ll-5050').disabled = true;
    const wrong = ['a','b','c','d'].filter(k => k !== activeQuestion.ans);
    wrong.sort(()=>Math.random()-0.5).slice(0,2).forEach(k => document.getElementById(`opt-${k.toUpperCase()}`).classList.add('faded'));
    showToast('✂️ Two wrong answers removed!');
}
function useSkip() {
    if (lifelineUsed['skip'] || !gameActive) return;
    lifelineUsed['skip'] = true;
    document.getElementById('ll-skip').disabled = true;
    stopTimer(); removeExplanation();
    showToast('⏭️ Question skipped!');
    total++;
    setTimeout(loadQuestion, 600);
}
function useDouble() {
    if (lifelineUsed['double'] || !gameActive) return;
    lifelineUsed['double'] = true;
    document.getElementById('ll-double').disabled = true;
    doubleActive = true;
    showToast('⚡ DOUBLE POINTS active!');
}

// ─── Helpers ──────────────────────────────────────────────────
function disableOptions() { ['A','B','C','D'].forEach(l => document.getElementById(`opt-${l}`).disabled = true); }

// ─── End Game ─────────────────────────────────────────────────
function endGame() {
    gameActive = false; stopTimer(); removeExplanation();
    const best = Math.max(score, parseInt(localStorage.getItem('hht_best_score')||'0'));
    localStorage.setItem('hht_best_score', best);

    let rank = 'Rookie';
    if (level >= 5) rank = 'Trainee';
    if (level >= 15) rank = 'Paramedic';
    if (level >= 30) rank = 'Doctor';
    if (level >= 50) rank = 'Health Master';

    document.getElementById('go-icon').textContent   = score > 0 ? '🩺' : '🏥';
    document.getElementById('go-title').textContent  = rank === 'Health Master' ? 'Health Master!' : `Rank: ${rank}!`;
    document.getElementById('prize-won').textContent = `Score: ${score.toLocaleString()}`;
    document.getElementById('go-sub').textContent    = `You reached Level ${level} with ${correct} correct answers.`;
    document.getElementById('fstat-qs').textContent  = total;
    document.getElementById('fstat-acc').textContent = total > 0 ? Math.round(correct/total*100)+'%' : '0%';
    document.getElementById('fstat-best').textContent = best.toLocaleString();
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// ─── Start Game ───────────────────────────────────────────────
function startGame() {
    currentQ = 0; level = 1; score = 0; correct = 0; total = 0;
    doubleActive = false; gameActive = true;
    resetLifelines();
    document.getElementById('score-val').textContent = '0';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    loadQuestion();
}

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200);
}

// ─── Init ─────────────────────────────────────────────────────
(function init() {
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('retry-btn').addEventListener('click', startGame);
    document.getElementById('opt-A').addEventListener('click', () => handleAnswer('a'));
    document.getElementById('opt-B').addEventListener('click', () => handleAnswer('b'));
    document.getElementById('opt-C').addEventListener('click', () => handleAnswer('c'));
    document.getElementById('opt-D').addEventListener('click', () => handleAnswer('d'));
    document.getElementById('ll-5050').addEventListener('click',  use5050);
    document.getElementById('ll-skip').addEventListener('click',  useSkip);
    document.getElementById('ll-double').addEventListener('click', useDouble);
    document.addEventListener('keydown', e => {
        if (!gameActive) return;
        const map = { 'a':'a','b':'b','c':'c','d':'d','1':'a','2':'b','3':'c','4':'d' };
        const ans = map[e.key.toLowerCase()];
        if (ans) handleAnswer(ans);
    });
})();
