// ============================================================
// ENGLISH GRAMMAR QUIZ – 50 Level Learning Game
// ============================================================

const TIMER_DURATION = 30;
const LEVEL_SIZE     = 10;
const POINTS_BASE    = 100;
const CIRCUMFERENCE  = 2 * Math.PI * 44;

// ─── Seen Questions Logic ────────────────────────────────────
let seenQuestions = JSON.parse(localStorage.getItem('egq_seen_questions') || '[]');

// ─── QUESTION BANK ───────────────────────────────────────────
const BANK = {

    articles: [
        { q:'She is ___ honest woman.', a:'a', b:'an', c:'the', d:'–', ans:'b', explain:'"Honest" starts with a silent "h" and a vowel sound /ɒ/.' },
        { q:'I saw ___ elephant at the zoo.', a:'a', b:'an', c:'the', d:'–', ans:'b', explain:'"Elephant" starts with a vowel sound.' },
        { q:'___ sun rises in the east.', a:'A', b:'An', c:'The', d:'–', ans:'c', explain:'The sun is a unique celestial body.' },
        { q:'He wants to become ___ engineer.', a:'the', b:'a', c:'an', d:'–', ans:'c', explain:'Use "an" before a vowel sound.' },
        { q:'Can you pass me ___ salt?', a:'a', b:'an', c:'the', d:'–', ans:'c', explain:'Refers to a specific item already present.' },
        { q:'I need ___ umbrella today.', a:'a', b:'an', c:'the', d:'–', ans:'b', explain:'"Umbrella" starts with a vowel sound.' },
        { q:'She plays ___ piano beautifully.', a:'a', b:'an', c:'the', d:'–', ans:'c', explain:'Musical instruments take "the".' },
        { q:'He is ___ university professor.', a:'a', b:'an', c:'the', d:'–', ans:'a', explain:'"University" starts with a consonant sound /j/.' },
        { q:'___ Amazon is the longest river.', a:'A', b:'An', c:'The', d:'–', ans:'c', explain:'Rivers always take "the".' },
        { q:'I bought ___ new phone yesterday.', a:'a', b:'an', c:'the', d:'–', ans:'a', explain:'First mention of a singular countable noun.' },
        { q:'___ Moon orbits the Earth.', a:'A', b:'An', c:'The', d:'–', ans:'c', explain:'Unique celestial bodies.' },
        { q:'He ate ___ apple for breakfast.', a:'a', b:'an', c:'the', d:'–', ans:'b', explain:'Vowel sound "a".' },
        { q:'I have ___ headache.', a:'a', b:'an', c:'the', d:'–', ans:'a', explain:'Common illnesses use "a".' },
        { q:'Wait for ___ hour.', a:'a', b:'an', c:'the', d:'–', ans:'b', explain:'Silent "h", starts with vowel sound.' },
        { q:'She lives in ___ Netherlands.', a:'a', b:'an', c:'the', d:'–', ans:'c', explain:'Country names in plural form use "the".' },
        { q:'___ water is essential for life.', a:'A', b:'An', c:'The', d:'No article', ans:'d', explain:'General uncountable nouns take no article.' },
        { q:'___ English is a global language.', a:'An', b:'The', c:'A', d:'No article', ans:'d', explain:'Languages do not take articles.' },
        { q:'He is ___ tallest boy in class.', a:'a', b:'the', c:'an', d:'–', ans:'b', explain:'Superlatives take "the".' },
        { q:'She came ___ first in the race.', a:'a', b:'an', c:'the', d:'–', ans:'c', explain:'Ordinal numbers take "the".' },
        { q:'I go to ___ church on Sundays.', a:'a', b:'an', c:'the', d:'No article', ans:'d', explain:'Places visited for primary purpose (church, school) take no article.' },
        { q:'They visited ___ Eiffel Tower.', a:'a', b:'an', c:'the', d:'–', ans:'c', explain:'Famous monuments take "the".' },
        { q:'I saw ___ one-eyed man.', a:'a', b:'an', c:'the', d:'–', ans:'a', explain:'"One" starts with a consonant sound /w/.' },
        { q:'Paris is ___ capital of France.', a:'a', b:'an', c:'the', d:'–', ans:'c', explain:'Specific designation.' },
        { q:'Is there ___ hotel near here?', a:'a', b:'an', c:'the', d:'–', ans:'a', explain:'Asking about any hotel.' },
        { q:'He is ___ M.A. in English.', a:'a', b:'an', c:'the', d:'–', ans:'b', explain:'"M" /em/ starts with a vowel sound.' },
        { q:'Mount Everest is ___ highest peak.', a:'a', b:'an', c:'the', d:'–', ans:'c', explain:'Superlative peak.' },
        { q:'___ rich should help the poor.', a:'A', b:'An', c:'The', d:'–', ans:'c', explain:'"The + adjective" represents a whole class.' },
        { q:'I read ___ interesting book.', a:'a', b:'an', c:'the', d:'–', ans:'b', explain:'Vowel sound.' },
        { q:'She has ___ cat and a dog.', a:'a', b:'an', c:'the', d:'–', ans:'a', explain:'First mention.' },
        { q:'I love ___ listening to music.', a:'a', b:'an', c:'the', d:'No article', ans:'d', explain:'Abstract/general activities.' },
    ],

    tenses: [
        { q:'She ___ to school every day.', a:'go', b:'goes', c:'went', d:'going', ans:'b', explain:'Simple present for routine habits.' },
        { q:'They ___ football right now.', a:'play', b:'played', c:'are playing', d:'will play', ans:'c', explain:'Present continuous for actions in progress.' },
        { q:'I ___ my homework already.', a:'finish', b:'finished', c:'have finished', d:'had finished', ans:'c', explain:'Present perfect for completed actions with relevance to now.' },
        { q:'We ___ to the cinema last night.', a:'go', b:'goes', c:'went', d:'have gone', ans:'c', explain:'Simple past for specific past time.' },
        { q:'If it rains, we ___ at home.', a:'stay', b:'stayed', c:'will stay', d:'would stay', ans:'c', explain:'First conditional: real future possibility.' },
        { q:'When I arrived, they ___ dinner.', a:'eat', b:'ate', c:'were eating', d:'had eaten', ans:'c', explain:'Past continuous for action in progress when another happened.' },
        { q:'He ___ in London for ten years.', a:'lives', b:'lived', c:'has lived', d:'is living', ans:'c', explain:'Present perfect for duration spanning past to present.' },
        { q:'The train ___ at 9 AM tomorrow.', a:'leave', b:'left', c:'leaves', d:'has left', ans:'c', explain:'Simple present for scheduled future events.' },
        { q:'By next year, I ___ my degree.', a:'finish', b:'finished', c:'will have finished', d:'shall finish', ans:'c', explain:'Future perfect for completion before a point in future.' },
        { q:'I ___ him since childhood.', a:'know', b:'knew', c:'have known', d:'had known', ans:'c', explain:'State verb "know" in present perfect.' },
        { q:'___ you see him yesterday?', a:'Do', b:'Have', c:'Did', d:'Was', ans:'c', explain:'Past tense question helper.' },
        { q:'I wish I ___ a bird.', a:'am', b:'was', c:'were', d:'be', ans:'c', explain:'Subjunctive mood for hypothetical wish.' },
        { q:'He ___ working since morning.', a:'is', b:'was', c:'has been', d:'had been', ans:'c', explain:'Present perfect continuous for action duration.' },
        { q:'They ___ their breakfast when I arrived.', a:'finished', b:'were finished', c:'had finished', d:'have finished', ans:'c', explain:'Past perfect: one action before another in past.' },
        { q:'I ___ you tomorrow.', a:'call', b:'called', c:'will call', d:'has called', ans:'c', explain:'Simple future.' },
        { q:'The Earth ___ around the Sun.', a:'revolve', b:'revolves', c:'revolved', d:'revolving', ans:'b', explain:'Universal truth in simple present.' },
        { q:'She ___ English for five years.', a:'learns', b:'learned', c:'has been learning', d:'is learning', ans:'c', explain:'Duration of learning.' },
        { q:'Water ___ at 100 degrees Celsius.', a:'boil', b:'boils', c:'boiled', d:'boiling', ans:'b', explain:'Scientific fact.' },
        { q:'I ___ my keys. Can you help me?', a:'lose', b:'lost', c:'have lost', d:'am losing', ans:'c', explain:'Current result of past action.' },
        { q:'We ___ to Paris many times.', a:'are', b:'went', c:'have been', d:'were', ans:'c', explain:'Experiential past.' },
        { q:'She ___ the Piano since 2015.', a:'plays', b:'played', c:'has been playing', d:'is playing', ans:'c', explain:'Continuous action from past.' },
        { q:'If I ___ you, I would take that offer.', a:'am', b:'was', c:'were', d:'be', ans:'c', explain:'Second conditional (unreal).' },
        { q:'They ___ each other for ages.', a:'know', b:'knows', b:'have known', d:'are knowing', ans:'c', explain:'State verb "know" doesn\'t take continuous form.' },
        { q:'I ___ the report by Friday.', a:'finish', b:'finished', c:'will have finished', d:'shall finish', ans:'c', explain:'Future deadline.' },
        { q:'What ___ you doing at 8 PM?', a:'are', b:'were', c:'was', d:'had', ans:'b', explain:'Past continuous question.' },
        { q:'He ___ home yet.', a:'hasn\'t come', b:'didn\'t come', c:'doesn\'t come', d:'wasn\'t coming', ans:'a', explain:'"Yet" usually with present perfect negative.' },
        { q:'I ___ my lunch before he came.', a:'ate', b:'have eaten', c:'had eaten', d:'was eating', ans:'c', explain:'Action before past action.' },
        { q:'Look! The bus ___.', a:'comes', b:'came', c:'is coming', d:'will come', ans:'c', explain:'Action at moment of speaking.' },
        { q:'I ___ to the gym every weekend.', a:'go', b:'goes', c:'went', d:'going', ans:'a', explain:'First person routine.' },
        { q:'She ___ her hair now.', a:'washes', b:'is washing', c:'washed', d:'will wash', ans:'b', explain:'Current action.' },
    ],

    prepositions: [
        { q:'He arrived ___ Monday.', a:'in', b:'on', c:'at', d:'by', ans:'b', explain:'Days take "on".' },
        { q:'She lives ___ New York.', a:'in', b:'on', c:'at', d:'by', ans:'a', explain:'Cities take "in".' },
        { q:'The meeting is ___ 10 AM.', a:'in', b:'on', c:'at', d:'by', ans:'c', explain:'Specific time takes "at".' },
        { q:'I am fond ___ music.', a:'of', b:'for', c:'about', d:'with', ans:'a', explain:'"Fond of" is a fixed phrase.' },
        { q:'He died ___ cancer.', a:'from', b:'of', c:'by', d:'with', ans:'b', explain:'"Died of" a disease.' },
        { q:'Distribute the sweets ___ the boys.', a:'between', b:'among', c:'with', d:'to', ans:'b', explain:'"Among" for more than two.' },
        { q:'The cat sat ___ the table.', a:'on', b:'in', c:'at', d:'under', ans:'d', explain:'Common position.' },
        { q:'I shall return ___ an hour.', a:'in', b:'after', c:'at', d:'within', ans:'a', explain:'Future time limit.' },
        { q:'She is good ___ Math.', a:'in', b:'at', c:'on', d:'for', ans:'b', explain:'"Good at" skills.' },
        { q:'He was born ___ 1990.', a:'in', b:'on', c:'at', d:'by', ans:'a', explain:'Years take "in".' },
        { q:'Wait ___ me at the gate.', a:'for', b:'to', c:'with', d:'at', ans:'a', explain:'"Wait for" someone.' },
        { q:'The book is ___ the table.', a:'in', b:'on', c:'at', d:'by', ans:'b', explain:'Surface contact.' },
        { q:'She is married ___ a doctor.', a:'with', b:'to', c:'by', d:'for', ans:'b', explain:'"Married to" someone.' },
        { q:'He jumped ___ the river.', a:'in', b:'into', c:'on', d:'to', ans:'b', explain:'"Into" indicates motion towards inside.' },
        { q:'Open your book ___ page 10.', a:'at', b:'on', c:'to', d:'in', ans:'a', explain:'Specific point.' },
        { q:'He came ___ car.', a:'in', b:'by', b:'with', d:'on', ans:'b', explain:'Mode of transport.' },
        { q:'I have been waiting ___ 2 o\'clock.', a:'for', b:'since', c:'from', d:'at', ans:'b', explain:'Point of time.' },
        { q:'The keys are ___ the drawer.', a:'in', b:'on', b:'at', d:'under', ans:'a', explain:'Enclosed space.' },
        { q:'She is angry ___ me.', a:'with', b:'at', c:'on', d:'to', ans:'a', explain:'"With" for people.' },
        { q:'He is afraid ___ dogs.', a:'from', b:'of', c:'by', d:'about', ans:'b', explain:'"Afraid of".' },
        { q:'Translate this ___ Hindi.', a:'in', b:'to', c:'into', d:'with', ans:'c', explain:'Transformation.' },
        { q:'The bird is ___ the tree.', a:'in', b:'on', c:'at', d:'to', ans:'a', explain:'Within branches.' },
        { q:'I will meet you ___ lunch.', a:'in', b:'at', c:'on', d:'during', ans:'b', explain:'Event time.' },
        { q:'He walked ___ the bridge.', a:'on', b:'across', c:'over', d:'along', ans:'b', explain:'One side to another.' },
        { q:'She sat ___ her desk.', a:'in', b:'on', c:'at', d:'by', ans:'c', explain:'Work position.' },
        { q:'I wrote it ___ a pen.', a:'by', b:'with', c:'in', d:'from', ans:'b', explain:'Instrumental.' },
        { q:'He is superior ___ me.', a:'than', b:'to', c:'from', d:'by', ans:'b', explain:'"Superior/Inferior to".' },
        { q:'She was born ___ July.', a:'in', b:'on', c:'at', d:'during', ans:'a', explain:'Months.' },
        { q:'The plane flew ___ the mountains.', a:'on', b:'over', c:'across', d:'above', ans:'b', explain:'Higher than.' },
        { q:'I am tired ___ waiting.', a:'of', b:'from', c:'with', d:'about', ans:'a', explain:'"Tired of".' },
    ],

    subject_verb: [
        { q:'Each of the boys ___ a prize.', a:'receive', b:'receives', c:'receiving', d:'have received', ans:'b', explain:'"Each" is singular.' },
        { q:'Neither of the two sisters ___ here.', a:'is', b:'are', c:'were', d:'be', ans:'a', explain:'"Neither" is singular.' },
        { q:'The news ___ true.', a:'is', b:'are', c:'were', d:'be', ans:'a', explain:'"News" is uncountable singular.' },
        { q:'Bread and butter ___ my breakfast.', a:'is', b:'are', c:'were', d:'have', ans:'a', explain:'Two items forming one unit.' },
        { q:'Many a student ___ failed.', a:'has', b:'have', c:'had', d:'is', ans:'a', explain:'"Many a" takes singular noun & verb.' },
        { q:'The quality of the mangoes ___ not good.', a:'was', b:'were', c:'are', d:'am', ans:'a', explain:'Subject is "quality" (singular).' },
        { q:'One of my friends ___ coming.', a:'is', b:'are', c:'were', d:'am', ans:'a', explain:'Subject is "one".' },
        { q:'Time and tide ___ for none.', a:'wait', b:'waits', c:'waiting', d:'waited', ans:'b', explain:'Singular unit.' },
        { q:'Physics ___ a difficult subject.', a:'is', b:'are', c:'were', b:'be', ans:'a', explain:'Subjects ending in -s are singular.' },
        { q:'The committee ___ divided in their opinion.', a:'is', b:'was', c:'are', d:'has', ans:'c', explain:'Collective noun as individuals takes plural.' },
        { q:'Five kilometers ___ a long distance.', a:'is', b:'are', c:'were', d:'am', ans:'a', explain:'Measurement unit.' },
        { q:'Ravi as well as his friends ___ present.', a:'is', b:'are', c:'were', d:'am', ans:'a', explain:'Verb agrees with first subject.' },
        { q:'Neither you nor I ___ to blame.', a:'is', b:'are', c:'am', d:'were', ans:'c', explain:'Agrees with closer subject.' },
        { q:'Either he or I ___ wrong.', a:'is', b:'are', c:'am', d:'were', ans:'c', explain:'Closer subject.' },
        { q:'A number of students ___ present.', a:'is', b:'are', c:'was', d:'has', ans:'b', explain:'"A number of" is plural.' },
        { q:'The number of books ___ increasing.', a:'is', b:'are', c:'was', d:'has', ans:'a', explain:'"The number of" is singular.' },
        { q:'Mathematics ___ an interesting subject.', a:'is', b:'are', c:'were', d:'be', ans:'a', explain:'Singular field of study.' },
        { q:'Slow and steady ___ the race.', a:'win', b:'wins', c:'winning', d:'won', ans:'b', explain:'Proverbial singular unit.' },
        { q:'Politics ___ a dirty game.', a:'is', b:'are', c:'were', d:'has', ans:'a', explain:'Uncountable singular.' },
        { q:'The Himalayas ___ to the north.', a:'lie', b:'lies', c:'lying', d:'lay', ans:'a', explain:'Mountain ranges are plural.' },
        { q:'Gulliver\'s Travels ___ written by Swift.', a:'is', b:'was', c:'are', d:'were', ans:'b', explain:'Book titles are singular.' },
        { q:'My glasses ___ on the table.', a:'is', b:'was', c:'are', d:'has', ans:'c', explain:'Always plural.' },
        { q:'Twenty kilos ___ too heavy.', a:'is', b:'are', c:'were', d:'am', ans:'a', explain:'Units of mass.' },
        { q:'The jury ___ announced its verdict.', a:'is', b:'has', c:'have', d:'are', ans:'b', explain:'Singular unit.' },
        { q:'Not only he but also his parents ___ there.', a:'is', b:'was', c:'were', d:'has', ans:'c', explain:'Secondary subject.' },
        { q:'Plenty of milk ___ available.', a:'is', b:'are', c:'were', d:'have', ans:'a', explain:'Uncountable quantity.' },
        { q:'Most of the workers ___ on strike.', a:'is', b:'are', c:'was', d:'has', ans:'b', explain:'Countable plural portion.' },
        { q:'Cattle ___ grazing in the field.', a:'is', b:'was', c:'are', d:'has', ans:'c', explain:'Always plural.' },
        { q:'Police ___ caught the thief.', a:'has', b:'have', c:'is', d:'was', ans:'b', explain:'Always plural.' },
        { q:'Two thirds of the city ___ in ruins.', a:'is', b:'are', c:'were', d:'have', ans:'a', explain:'Singular entity portion.' },
    ],

    pronouns: [
        { q:'It is ___ who helped you.', a:'me', b:'I', c:'my', d:'myself', ans:'b', explain:'Subjective form after "it is".' },
        { q:'This pen is ___.', a:'my', b:'mine', c:'me', d:'I', ans:'b', explain:'Possessive pronoun.' },
        { q:'Whom do you want to see? ___', a:'I', b:'My', c:'Me', d:'Mine', ans:'c', explain:'Object pronoun.' },
        { q:'___ of the two sisters is prettier?', a:'Who', b:'Which', c:'Whose', d:'Whom', ans:'b', explain:'Selection between two.' },
        { q:'None of us ___ ready.', a:'is', b:'are', c:'were', d:'be', ans:'a', explain:'"None" follows singular.' },
        { q:'Between you and ___, he is a liar.', a:'I', b:'me', c:'my', d:'we', ans:'b', explain:'Object of preposition.' },
        { q:'This is the house ___ Jack built.', a:'who', b:'which', c:'whom', d:'whose', ans:'b', explain:'Relative pronoun for things.' },
        { q:'Let ___ do our work.', a:'we', b:'us', c:'our', d:'ours', ans:'b', explain:'Object of "let".' },
        { q:'I myself ___ there.', a:'go', b:'goes', c:'went', d:'going', ans:'c', explain:'Intensive pronoun.' },
        { q:'Every man must do ___ duty.', a:'their', b:'his', b:'one\'s', d:'our', ans:'b', explain:'Individual possessive.' },
        { q:'God helps those who help ___.', a:'themselves', b:'hisself', b:'ourselves', d:'theyself', ans:'a', explain:'Reflexive plural.' },
        { q:'One must love ___ country.', a:'his', b:'one\'s', c:'their', d:'her', ans:'b', explain:'Agrees with "one".' },
        { q:'She and ___ are friends.', a:'me', b:'I', c:'my', d:'mine', ans:'b', explain:'Joint subject.' },
        { q:'Whose book is this? It\'s ___.', a:'her', b:'hers', c:'she', d:'herself', ans:'b', explain:'Predicate possessive.' },
        { q:'I didn\'t see ___ there.', a:'somebody', b:'anybody', c:'nobody', d:'none', ans:'b', explain:'Negative sentence "anybody".' },
        { q:'He is taller than ___.', a:'me', b:'I', c:'my', d:'mine', ans:'b', explain:'Comparison (than I am).' },
        { q:'This is the boy ___ I saw.', a:'who', b:'whom', c:'whose', d:'which', ans:'b', explain:'Object relative.' },
        { q:'Each other is used for ___ people.', a:'two', b:'many', c:'one', d:'few', ans:'a', explain:'Reciprocal for two.' },
        { q:'One another is used for ___ people.', a:'two', b:'more than two', c:'three', d:'few', ans:'b', explain:'Reciprocal for many.' },
        { q:'___ are you talking to?', a:'Who', b:'Whom', c:'Whose', d:'Which', ans:'b', explain:'Object of "to".' },
        { q:'This is the man ___ car was stolen.', a:'who', b:'whom', c:'whose', d:'which', ans:'c', explain:'Possessive relative.' },
        { q:'He told ___ the secret.', a:'I', b:'me', c:'my', d:'myself', ans:'b', explain:'Indirect object.' },
        { q:'We enjoyed ___ at the party.', a:'us', b:'ourselves', b:'our', d:'each other', ans:'b', explain:'Reflexive verb.' },
        { q:'None but ___ brave deserve the fair.', a:'a', b:'the', c:'an', d:'–', ans:'b', explain:'Specific class.' },
        { q:'___ do you trust?', a:'Who', b:'Whom', c:'Whose', d:'Which', ans:'b', explain:'Object question.' },
        { q:'She did it ___', a:'herself', b:'himself', c:'itself', d:'myself', ans:'a', explain:'Feminine reflexive.' },
        { q:'Everything has ___ place.', a:'it\'s', b:'its', c:'their', d:'his', ans:'b', explain:'Neuter possessive.' },
        { q:'Neither of them brought ___ book.', a:'their', b:'his', c:'her', d:'our', ans:'b', explain:'Distributive possessive.' },
        { q:'This is identical ___ that.', a:'with', b:'to', c:'on', d:'at', ans:'b', explain:'Comparison preposition.' },
        { q:'I know the man ___ you met.', a:'who', b:'whom', c:'which', d:'whose', ans:'b', explain:'Relative object.' },
    ],

    conjunctions: [
        { q:'He is poor ___ honest.', a:'and', b:'but', c:'or', d:'so', ans:'b', explain:'Contrast.' },
        { q:'Work hard ___ you will fail.', a:'and', b:'but', c:'or', d:'so', ans:'c', explain:'Condition/Alternative.' },
        { q:'She was late ___ she missed the bus.', a:'because', b:'and', c:'but', d:'so', ans:'a', explain:'Reason.' },
        { q:'Catch me ___ you can.', a:'if', b:'unless', c:'until', d:'since', ans:'a', explain:'Condition.' },
        { q:'Wait here ___ I return.', a:'when', b:'while', c:'until', d:'as', ans:'c', explain:'Time limit.' },
        { q:'He is not only rich ___ also kind.', a:'but', b:'and', c:'yet', d:'so', ans:'a', explain:'Correlative.' },
        { q:'Neither he ___ his brother came.', a:'or', b:'nor', c:'and', b:'but', ans:'b', explain:'Correlative.' },
        { q:'Either tea ___ coffee will do.', a:'or', b:'nor', c:'and', b:'but', ans:'a', explain:'Correlative.' },
        { q:'Though he is old ___ he is active.', a:'yet', b:'but', c:'still', d:'and', ans:'a', explain:'Correlative contrast.' },
        { q:'Scarcely had he reached ___ it rained.', a:'than', b:'when', c:'then', d:'while', ans:'b', explain:'Time sequence correlative.' },
        { q:'No sooner did he arrive ___ it began to rain.', a:'than', b:'when', c:'then', d:'while', ans:'a', explain:'Time sequence correlative.' },
        { q:'I will go ___ you stay.', b:'provided', b:'though', c:'unless', d:'notwithstanding', ans:'a', explain:'Condition.' },
        { q:'Both Ram ___ Shyam are brothers.', a:'and', b:'as well as', c:'with', d:'together', ans:'a', explain:'Correlative.' },
        { q:'I asked him ___ he was ready.', a:'that', b:'if', c:'whether', d:'as', ans:'c', explain:'Alternative question.' },
        { q:'Run fast ___ you should miss the train.', a:'else', b:'lest', c:'or', b:'otherwise', ans:'b', explain:'"Lest" followed by "should".' },
        { q:'Since he is ill ___ he cannot work.', a:'as', b:'so', c:'therefore', d:'No conjunction', ans:'d', explain:'Single reason marker needed.' },
        { q:'I haven\'t seen him ___ he left.', a:'when', b:'since', c:'before', d:'after', ans:'b', explain:'Time point.' },
        { q:'He failed ___ he didn\'t study.', a:'since', b:'as', c:'because', d:'All of these', ans:'d', explain:'Synonyms for reason.' },
        { q:'Wait ___ he comes.', a:'since', b:'till', c:'unless', d:'while', ans:'b', explain:'Fixed time.' },
        { q:'___ you like it or not, I will go.', a:'If', b:'Whether', c:'Though', d:'Lest', ans:'b', explain:'Choice marker.' },
        { q:'Stay here ___ I am away.', a:'since', b:'while', c:'until', d:'as long as', ans:'b', explain:'Duration.' },
        { q:'He is taller ___ I expected.', a:'than', b:'then', c:'as', d:'to', ans:'a', explain:'Comparison.' },
        { q:'He was punished ___ he was guilty.', a:'so', b:'because', c:'but', d:'although', ans:'b', explain:'Moral reason.' },
        { q:'Unless you work hard, you ___ pass.', a:'won\'t', b:'will', b:'can', d:'should', ans:'a', explain:'Implicit negative.' },
        { q:'I will play ___ I am tired.', a:'if', b:'though', c:'because', d:'and', ans:'b', explain:'Concession.' },
        { q:'He is honest ___ he is poor.', a:'and', b:'but', c:'although', d:'so', ans:'c', explain:'Contrast marker.' },
        { q:'Make hay ___ the sun shines.', a:'when', b:'while', c:'as', d:'so', ans:'b', explain:'Synchronized duration.' },
        { q:'She can sing ___ she can\'t dance.', a:'and', b:'but', c:'or', d:'so', ans:'b', explain:'Difference in skill.' },
        { q:'I didn\'t go ___ it was raining.', a:'since', b:'because', c:'as', d:'All of these', ans:'d', explain:'Reason triggers.' },
        { q:'He worked hard ___ he might win.', a:'that', b:'so that', c:'in order that', d:'All of these', ans:'d', explain:'Purpose markers.' },
    ],

    sentence_correction: [
        { q:'Incorrect: He is my cousin brother. Correct:', a:'He is my cousin.', b:'He is my cousin-brother.', c:'He is my brother.', d:'He is cousin.', ans:'a', explain:'"Cousin" includes gender context.' },
        { q:'Incorrect: She is more taller. Correct:', a:'She is taller.', b:'She is more tall.', c:'She is tallest.', d:'She is very taller.', ans:'a', explain:'No double comparatives.' },
        { q:'Incorrect: I look forward to meet you. Correct:', a:'I look forward to meeting you.', b:'I look forward meeting you.', c:'I look forward meet you.', d:'I look forward to have met you.', ans:'a', explain:'"Look forward to" takes gerund.' },
        { q:'Incorrect: He don\'t know. Correct:', a:'He doesn\'t know.', b:'He not know.', c:'He do not know.', d:'He don\'t knows.', ans:'a', explain:'Third person singular.' },
        { q:'Incorrect: One of my friend is here. Correct:', a:'One of my friends is here.', b:'One of my friends are here.', c:'One of my friend are here.', d:'My one friend is here.', ans:'a', explain:'"One of" takes plural noun.' },
        { q:'Which is correct?', a:'I prefer tea than coffee.', b:'I prefer tea over coffee.', c:'I prefer tea to coffee.', d:'I prefer tea from coffee.', ans:'c', explain:'"Prefer to".' },
        { q:'Incorrect: I didn\'t saw him. Correct:', a:'I didn\'t see him.', b:'I hadn\'t saw him.', c:'I don\'t saw him.', d:'I not saw him.', ans:'a', explain:'"Did not" + base verb.' },
        { q:'Incorrect: He is sick since Monday. Correct:', a:'He has been sick since Monday.', b:'He was sick since Monday.', c:'He is being sick since Monday.', d:'He had sick since Monday.', ans:'a', explain:'Duration requires perfect tense.' },
        { q:'Correct the sentence: I have a news.', a:'I have some news.', b:'I have news.', c:'I have an news.', d:'A and B', ans:'d', explain:'"News" is uncountable.' },
        { q:'Identify the error: He said me.', a:'He said me.', b:'He told me.', c:'He spoke me.', d:'He explained me.', ans:'b', explain:'"Say" needs "to" or no object.' },
        { q:'Correct: She returned back. Correct:', a:'She returned.', b:'She came back.', c:'She returned back again.', d:'A and B', ans:'d', explain:'"Return" means come back.' },
        { q:'Correct: Suppose if it rains. Correct:', a:'Suppose it rains.', b:'If it rains.', c:'What if it rains?', d:'All of these', ans:'d', explain:'"Suppose" and "if" are redundant together.' },
        { q:'Correct: I am having a car.', a:'I have a car.', b:'I am having car.', c:'I has a car.', d:'I am have a car.', ans:'a', explain:'Stative "have" for possession.' },
        { q:'Which one is right?', a:'I am 20 years.', b:'I am 20 years old.', c:'I am 20 years of age.', d:'B and C', ans:'d', explain:'Standard age idioms.' },
        { q:'Correct: I am waiting for you since 2 hours.', a:'I have been waiting for you for 2 hours.', b:'I am waiting for you for 2 hours.', c:'I was waiting for you since 2 hours.', d:'I wait for you for 2 hours.', ans:'a', explain:'Tense and preposition error.' },
        { q:'Correct the error: The climate of Pune is better than Mumbai.', a:'The climate of Pune is better than that of Mumbai.', b:'The climate of Pune is better than Mumbai\'s.', c:'Pune climate is better than Mumbai.', d:'A and B', ans:'d', explain:'Comparison of similar things.' },
        { q:'Identify correct: He did a mistake.', a:'He made a mistake.', b:'He committed a mistake.', c:'He performed a mistake.', d:'A and B', ans:'d', explain:'Collocation for mistakes.' },
        { q:'Correct: Tell me why did you do it?', a:'Tell me why you did it.', b:'Tell me why you did do it.', c:'Tell me why did you it.', d:'Why you did it tell me.', ans:'a', explain:'Subordinate clauses use statement order.' },
        { q:'Which is correct?', a:'I, you and he are friends.', b:'You, he and I are friends.', c:'He, I and you are friends.', d:'You, I and he are friends.', ans:'b', explain:'Social etiquette order 2-3-1.' },
        { q:'Correct the error: Beside being a teacher, he is a writer.', a:'Besides being a teacher, he is a writer.', b:'Beside a teacher he is writer.', c:'Beside been a teacher...', d:'None', ans:'a', explain:'"Besides" means in addition to.' },
        { q:'Choose correct: I cannot cope up with this.', a:'I cannot cope with this.', b:'I cannot cope up this.', c:'I cannot cope with it.', d:'A and C', ans:'d', explain:'"Cope with" is the correct phrasal verb.' },
        { q:'Correct: Many people were died.', a:'Many people died.', b:'Many people were dead.', c:'Many people was died.', d:'A and B', ans:'d', explain:'Passive "died" is incorrect.' },
        { q:'Correct: She works hardly.', a:'She works hard.', b:'She hardly works.', c:'She does hard work.', d:'A and C', ans:'d', explain:'"Hardly" means almost not.' },
        { q:'Correct: I am hearing a noise.', a:'I hear a noise.', b:'I am hearing noise.', c:'I heard a noise.', d:'A and C', ans:'d', explain:'Sensory verbs are stative.' },
        { q:'Correct: Each student have a pen.', a:'Each student has a pen.', b:'Each students has a pen.', c:'Every student has a pen.', d:'A and C', ans:'d', explain:'"Each" is singular.' },
        { q:'Correct: I saw him to go.', a:'I saw him go.', b:'I saw him going.', c:'I seen him go.', d:'A and B', ans:'d', explain:'Verbs of perception take bare infinitive.' },
        { q:'Select correct: This is a 10-rupees note.', a:'This is a 10-rupee note.', b:'This is 10 rupees note.', c:'This is ten rupees note.', d:'This note is 10-rupees.', ans:'a', explain:'Adjectival compound is singular.' },
        { q:'Correct: Although he is poor but he is honest.', a:'Although he is poor, he is honest.', b:'Although he is poor, yet he is honest.', c:'Though poor, he is honest.', d:'All of these', ans:'d', explain:'"But" is redundant with although.' },
        { q:'Which is right?', a:'He goes to school by foot.', b:'He goes to school on foot.', c:'He goes on foot to school.', d:'B and C', ans:'d', explain:'"On foot" is the idiom.' },
        { q:'Correct the sentence: Discuss about the matter.', a:'Discuss the matter.', b:'Discuss on the matter.', c:'Have a discussion about the matter.', d:'A and C', ans:'d', explain:'"Discuss" is transitive; no preposition.' },
    ],

    vocabulary: [
        { q:'Synonym of "Fast".', a:'Swift', b:'Slow', c:'Lazy', d:'Dull', ans:'a', explain:'Quick movement.' },
        { q:'Antonym of "Kind".', a:'Gentle', b:'Cruel', c:'Soft', d:'Nice', ans:'b', explain:'Opposite of helpful.' },
        { q:'Meaning of "Affluent".', a:'Poor', b:'Rich', c:'Strong', d:'Weak', ans:'b', explain:'Wealthy.' },
        { q:'A person who loves books.', a:'Philatelist', b:'Bibliophile', c:'Numismatist', d:'Pedestrian', ans:'b', explain:'"Biblio" = book.' },
        { q:'One who is all-powerful.', a:'Omniscient', b:'Omnipotent', c:'Omnipresent', d:'Infallible', ans:'b', explain:'"Potent" = power.' },
        { q:'Choose correctly spelt word.', a:'Committe', b:'Committee', c:'Comitte', d:'Commitee', ans:'b', explain:'Standard spelling.' },
        { q:'Synonym of "Abandon".', a:'Forsake', b:'Keep', c:'Cherish', d:'Hold', ans:'a', explain:'To leave behind.' },
        { q:'Antonym of "Victory".', a:'Success', b:'Defeat', c:'Triumph', d:'Win', ans:'b', explain:'Opposite of winning.' },
        { q:'Meaning of "Diligent".', a:'Hardworking', b:'Lazy', c:'Stupid', d:'Careless', ans:'a', explain:'Steady effort.' },
        { q:'Study of birds.', a:'Zoology', b:'Ornithology', c:'Botany', d:'Entomology', ans:'b', explain:'Specialized branch.' },
        { q:'One who hates mankind.', a:'Philanthropist', b:'Misanthrope', c:'Misogynist', d:'Optimist', ans:'b', explain:'"Mis-" = hate, "anthro" = man.' },
        { q:'Word for "Handwritten book".', a:'Biography', b:'Autobiography', c:'Manuscript', d:'Novel', ans:'c', explain:'"Manu" = hand.' },
        { q:'Synonym of "Enormous".', a:'Tiny', b:'Huge', c:'Broad', d:'Narrow', ans:'b', explain:'Very large.' },
        { q:'Antonym of "Ancient".', a:'Old', b:'Modern', c:'Antique', d:'Past', ans:'b', explain:'Opposite of old.' },
        { q:'A group of cows.', a:'Flock', b:'Herd', c:'Pack', d:'School', ans:'b', explain:'Animate group.' },
        { q:'A person who studies the stars.', a:'Astronaut', b:'Astronomer', c:'Astrologer', b:'Pilot', ans:'b', explain:'Scientific study.' },
        { q:'Synonym of "Fragile".', a:'Strong', b:'Delicate', c:'Tough', b:'Hard', ans:'b', explain:'Easy to break.' },
        { q:'Antonym of "Optimist".', a:'Pessimist', b:'Idealist', c:'Atheist', d:'Theist', ans:'a', explain:'Negative outlook.' },
        { q:'Meaning of "Vanish".', a:'Appear', b:'Disappear', c:'Stay', d:'Live', ans:'b', explain:'To go away.' },
        { q:'One who is present everywhere.', a:'Omnipresent', b:'Omnipotent', c:'Omniscient', d:'Unique', ans:'a', explain:'Present all over.' },
        { q:'Synonym of "Cordial".', a:'Friendly', b:'Rude', c:'Angry', d:'Cold', ans:'a', explain:'Warm and welcoming.' },
        { q:'Antonym of "Generous".', a:'Kind', b:'Selfish', c:'Miserly', d:'B and C', ans:'d', explain:'Not sharing.' },
        { q:'Life story of a person written by himself.', a:'Biography', b:'Autobiography', c:'Diary', d:'History', ans:'b', explain:'Self-written.' },
        { q:'Meaning of "Immaculate".', a:'Dirty', b:'Clean', c:'Pure', d:'B and C', ans:'d', explain:'Spotless.' },
        { q:'A person who eats no meat.', a:'Vegetarian', b:'Non-vegetarian', c:'Carnivore', d:'Omnivore', ans:'a', explain:'Dietary choice.' },
        { q:'Synonym of "Obsolete".', a:'New', b:'Ancient', c:'Outdated', d:'Current', ans:'c', explain:'No longer in use.' },
        { q:'Antonym of "Fear".', a:'Terror', b:'Courage', c:'Horror', d:'Panic', ans:'b', explain:'Opposite of being afraid.' },
        { q:'Meaning of "Lethargic".', a:'Energetic', b:'Lazy/Dull', c:'Active', d:'Strong', ans:'b', explain:'Lack of energy.' },
        { q:'One who knows everything.', a:'Omniscient', b:'Omnipotent', c:'Expert', d:'Scholar', ans:'a', explain:'Infinite knowledge.' },
        { q:'Choose the correct spelling.', a:'Accomodation', b:'Accommodation', c:'Acomodation', d:'Accomodasion', ans:'b', explain:'Double c, double m.' },
    ],

    conditionals: [
        { q:'If I ___ you, I would take the offer.', a:'am', b:'was', c:'were', d:'be', ans:'c', explain:'Second conditional (unreal).' },
        { q:'If it rains, we ___ go out.', a:'don\'t', b:'won\'t', b:'didn\'t', d:'wouldn\'t', ans:'b', explain:'First conditional negative.' },
        { q:'If he had told me, I ___ him.', a:'helped', b:'would help', c:'would have helped', d:'will help', ans:'c', explain:'Third conditional (past unreal).' },
        { q:'If you boil water, it ___ to steam.', a:'turns', b:'turned', c:'will turn', d:'would turn', ans:'a', explain:'Zero conditional (fact).' },
        { q:'I will help you unless you ___ me.', a:'don\'t ask', b:'ask', c:'won\'t ask', d:'will ask', ans:'b', explain:'"Unless" = if not. "Unless you ask" = "if you don\'t ask".' },
        { q:'If she ___ harder, she would pass.', a:'study', b:'studies', c:'studied', d:'had studied', ans:'c', explain:'Second conditional (possible but unlikely).' },
        { q:'He would have come if you ___ him.', a:'invite', b:'invited', c:'had invited', d:'would invite', ans:'c', explain:'Past perfect needed for past result.' },
        { q:'If I ___ the lottery, I would buy a house.', a:'win', b:'won', c:'had won', d:'will win', ans:'b', explain:'Second conditional.' },
        { q:'You would be tired if you ___.', a:'don\'t rest', b:'didn\'t rest', c:'not rest', d:'won\'t rest', ans:'b', explain:'Hypothetical present.' },
        { q:'I ___ stay at home if I were you.', a:'will', b:'shall', c:'would', d:'can', ans:'c', explain:'Advice context.' },
        { q:'If ice melts, it ___ water.', a:'becomes', b:'became', c:'will become', d:'would become', ans:'a', explain:'Law of nature.' },
        { q:'If we hurry, we ___ catch the bus.', a:'will', b:'would', c:'can', d:'A and C', ans:'d', explain:'Future possibility.' },
        { q:'If she goes now, she ___ early.', a:'reaches', b:'will reach', c:'reached', d:'would reach', ans:'b', explain:'Real future.' },
        { q:'He ___ won if he had tried.', a:'would', b:'would have', c:'will have', d:'had', ans:'b', explain:'Standard third conditional.' },
        { q:'If I ___ his number, I would call him.', a:'know', b:'knew', c:'known', d:'have known', ans:'b', explain:'Unreal present.' },
        { q:'You ___ get wet if you don\'t take an umbrella.', a:'will', b:'would', c:'shall', d:'can', ans:'a', explain:'Certain consequence.' },
        { q:'If life ___ easy, everyone would be happy.', a:'is', b:'was', c:'were', d:'be', ans:'c', explain:'Contrary to fact.' },
        { q:'He would help if he ___ money.', a:'has', b:'had', c:'have', d:'had had', ans:'b', explain:'Simple past for present unreal.' },
        { q:'If you ___ heat to ice, it melts.', a:'apply', b:'applied', c:'will apply', d:'would apply', ans:'a', explain:'Physical law.' },
        { q:'If I see him, I ___ tell him.', a:'will', b:'would', c:'was', d:'had', ans:'a', explain:'Real possibility.' },
        { q:'Provided that it ___ cold, we go for a walk.', a:'is not', b:'was not', b:'shall not be', d:'is', ans:'a', explain:'Condition marker.' },
        { q:'Suppose you ___ a million, what would you do?', a:'win', b:'won', c:'will win', d:'shall win', ans:'b', explain:'Hypothetical setup.' },
        { q:'In case it ___ , take an umbrella.', a:'rains', b:'rained', c:'will rain', d:'shall rain', ans:'a', explain:'Present for possible future.' },
        { q:'If I ___ there, I would have met him.', a:'was', b:'were', c:'had been', d:'am', ans:'c', explain:'Third conditional (past).' },
        { q:'If she ___ me, I would go.', b:'asks', b:'asked', c:'shall ask', d:'will ask', ans:'b', explain:'Second conditional.' },
        { q:'Should it rain, the match ___ cancelled.', a:'will be', b:'would be', c:'shall be', d:'is', ans:'b', explain:'Formal "if" alternative.' },
        { q:'Had I know, I ___ told you.', a:'would have', b:'will have', b:'should have', d:'could', ans:'a', explain:'Inversion for third conditional.' },
        { q:'If you touch fire, you ___ burned.', a:'get', b:'got', c:'will get', d:'A and C', ans:'d', explain:'Inevitable result.' },
        { q:'If I ___ wings, I would fly.', a:'have', b:'had', c:'am having', d:'has', ans:'b', explain:'Contrary to current state.' },
        { q:'Unless she ___ , she will fail.', a:'studies', b:'studied', c:'not studies', d:'study', ans:'a', explain:'Positive clause with unless.' },
    ],
};

// ─── Topic Display Names ───────────────────────────────────────
const TOPIC_LABELS = {
    articles:           '📝 Articles',
    tenses:             '⏰ Verb Tenses',
    prepositions:       '🔗 Prepositions',
    subject_verb:       '✔️ Subject–Verb',
    pronouns:           '🔁 Pronouns',
    conjunctions:       '🔧 Conjunctions',
    sentence_correction:'✍️ Sentence Fix',
    vocabulary:         '📖 Vocabulary',
    conditionals:       '💡 Conditionals',
};

// ─── Multi-Level Progression (50 Levels) ────────────────────────
const LEVEL_TOPICS = {
    easy:   ['articles','prepositions','pronouns'],
    medium: ['tenses','subject_verb','conjunctions'],
    hard:   ['sentence_correction','vocabulary','conditionals'],
};

function getTopicsForLevel(level) {
    if (level <= 10)      return LEVEL_TOPICS.easy;
    if (level <= 25)      return LEVEL_TOPICS.medium;
    if (level <= 40)      return LEVEL_TOPICS.hard;
    return Object.keys(BANK); // Level 41-50+ mix all
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
        // If all questions in these topics are seen, reset only these topics
        seenQuestions = seenQuestions.filter(id => !topics.some(t => id.startsWith(t + '_')));
        localStorage.setItem('egq_seen_questions', JSON.stringify(seenQuestions));
        return pickQuestion(level);
    }

    const q = available[Math.floor(Math.random() * available.length)];
    seenQuestions.push(q.id);
    localStorage.setItem('egq_seen_questions', JSON.stringify(seenQuestions));
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
    setTimeout(() => endGame(), 2500);
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
                setTimeout(() => { removeExplanation(); showLevelUp(); }, 1800);
            } else {
                setTimeout(() => { removeExplanation(); loadQuestion(); }, 1800);
            }
        } else {
            // WRONG
            selectedBtn.classList.remove('selected');
            selectedBtn.classList.add('wrong');
            document.getElementById(`opt-${activeQuestion.ans.toUpperCase()}`).classList.add('correct');
            playWrong();
            total++;
            showExplanation(activeQuestion.explain);
            setTimeout(() => endGame(), 2800);
        }
    }, 400);
}

// ─── Level Up ─────────────────────────────────────────────────
function showLevelUp() {
    playLevelUp();
    showToast(`🎉 Level ${level-1} Complete! → Level ${level}`);
    if (level > 50) {
        showToast("🏆 You\'ve reached the Master Level!");
    }
    setTimeout(loadQuestion, 1500);
}

// ─── Score Popup ──────────────────────────────────────────────
function showScorePopup(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:28%;left:50%;transform:translateX(-50%);font-size:2rem;font-weight:900;color:#a5b4fc;text-shadow:0 0 20px rgba(129,140,248,0.8);pointer-events:none;z-index:500;animation:scoreFloat 1s ease forwards;';
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
    el.innerHTML = `💡 <strong>Explanation:</strong> ${text}`;
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
    const best = Math.max(score, parseInt(localStorage.getItem('egq_best_score')||'0'));
    localStorage.setItem('egq_best_score', best);

    document.getElementById('go-icon').textContent   = score > 0 ? '🏆' : '📖';
    document.getElementById('go-title').textContent  = level >= 50 ? 'Master of Grammar!' : level >= 25 ? 'Advanced Scholar!' : 'Keep Learning!';
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
