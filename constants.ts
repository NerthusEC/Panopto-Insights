
import { Lecture } from "./types";

export const MOCK_LECTURES: Lecture[] = [
  {
    id: "cs101-algo",
    title: "Introduction to Algorithms: Sorting & Complexity",
    instructor: "Dr. Alan Turing",
    date: "Oct 12, 2023",
    duration: "10:00", // Adjusted to match sample video duration roughly
    subject: "Computer Science",
    thumbnailUrl: "https://picsum.photos/800/450?random=1",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    transcript: `
      Welcome everyone to CS101. Today we are discussing sorting algorithms and computational complexity. 
      Let's start with Big O notation. Big O notation describes the limiting behavior of a function when the argument tends towards a particular value or infinity. 
      In computer science, we use it to classify algorithms according to how their run time or space requirements grow as the input size grows.
      For example, O(1) is constant time. Accessing an array element by index is O(1).
      O(n) is linear time. Searching for a value in an unsorted list is O(n).
      O(n^2) is quadratic time. Bubble sort is a classic example of this.
      Now, let's talk about Quicksort. Quicksort is an efficient, general-purpose sorting algorithm. 
      Quicksort is a divide-and-conquer algorithm. It works by selecting a 'pivot' element from the array and partitioning the other elements into two sub-arrays, according to whether they are less than or greater than the pivot. 
      The sub-arrays are then sorted recursively. 
      On average, Quicksort has a complexity of O(n log n), which is much better than Bubble sort's O(n^2). However, in the worst case, it can degrade to O(n^2) if the pivot selection is poor.
      Merge sort is another O(n log n) algorithm. Unlike Quicksort, it is stable and guarantees O(n log n) even in the worst case, but it requires O(n) auxiliary space.
      Understanding these trade-offs is key to software engineering.
    `
  },
  {
    id: "hist202-rome",
    title: "The Fall of the Roman Republic",
    instructor: "Prof. Mary Beard",
    date: "Sep 28, 2023",
    duration: "10:00",
    subject: "History",
    thumbnailUrl: "https://picsum.photos/800/450?random=2",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    transcript: `
      Good morning. Today we turn our attention to the crisis of the Roman Republic.
      The Roman Republic didn't fall in a day. It was a long process of political turmoil, social unrest, and military ambition.
      One of the key figures was Julius Caesar. Caesar was a populist general who formed the First Triumvirate with Pompey and Crassus.
      After Crassus died, tensions rose between Caesar and Pompey. 
      In 49 BC, Caesar crossed the Rubicon river, a shallow stream in northern Italy. This act was a declaration of civil war.
      He famously said "Alea iacta est" or "The die is cast."
      Caesar defeated Pompey and established himself as dictator perpetuo (dictator in perpetuity).
      However, this concentration of power alarmed the Senators. 
      On the Ides of March (March 15), 44 BC, Caesar was assassinated by a group of senators led by Brutus and Cassius.
      They hoped to restore the Republic, but instead, they plunged Rome into another series of civil wars.
      Eventually, Caesar's adopted heir, Octavian, defeated Mark Antony and Cleopatra at the Battle of Actium in 31 BC.
      Octavian became Augustus, the first Roman Emperor, effectively ending the Republic and beginning the Roman Empire.
    `
  },
  {
    id: "phy301-qm",
    title: "Quantum Mechanics: The Double Slit Experiment",
    instructor: "Dr. Richard Feynman",
    date: "Nov 05, 2023",
    duration: "12:00",
    subject: "Physics",
    thumbnailUrl: "https://picsum.photos/800/450?random=3",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    transcript: `
      Hello class. Today we discuss the heart of quantum mechanics: the Double Slit Experiment.
      Imagine we fire particles, like electrons, at a wall with two slits. 
      If electrons were just particles, like little marbles, you would expect two bands of hits on the screen behind the wall.
      However, what we observe is an interference pattern—a series of bright and dark bands. 
      This is characteristic of waves, not particles. 
      When a wave passes through two slits, it diffracts and interferes with itself.
      This suggests that matter exhibits wave-particle duality.
      But here is the truly strange part. If we place a detector at the slits to see which slit the electron actually goes through, the interference pattern disappears!
      The act of observation collapses the wave function. The electrons behave like particles again, forming just two bands.
      This implies that the state of the system is dependent on whether or not we measure it. 
      This phenomenon challenges our classical intuition about reality.
      The Schrodinger equation describes how the quantum state of a physical system changes over time.
    `
  },
  {
    id: "art101-ren",
    title: "Renaissance Art: Perspective and Light",
    instructor: "Prof. Leonardo",
    date: "Dec 10, 2023",
    duration: "15:00",
    subject: "Art History",
    thumbnailUrl: "https://picsum.photos/800/450?random=4",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    transcript: `
      Welcome to Art History. The Renaissance was a rebirth of classical learning and a revolution in artistic technique.
      One of the most profound developments was linear perspective. 
      Before the Renaissance, art was often flat and symbolic. Figures were sized by importance, not by their distance from the viewer.
      Brunelleschi is credited with rediscovering linear perspective in the early 15th century in Florence.
      He demonstrated that parallel lines appear to converge at a single vanishing point on the horizon.
      This allowed artists like Masaccio and Raphael to create realistic 3D space on a 2D surface.
      Another key technique is Chiaroscuro—the use of strong contrasts between light and dark.
      Da Vinci took this further with Sfumato, a technique of blending colors so subtly that there are no perceptible transitions, like smoke.
      The Mona Lisa is the prime example of Sfumato.
      These techniques reflected a new humanism—a focus on the human experience and the natural world.
    `
  }
];
