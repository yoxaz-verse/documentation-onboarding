export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

export type CourseDivision = 'operator-core' | 'operator-mastery';

export type CourseCatalogMeta = {
  summary: string;
  theme: string;
  badge?: string;
  icon: string;
  coverTitle: string;
  coverSubtitle: string;
};

export type CourseSubModule = {
  id: string;
  courseId: string;
  order: number;
  title: string;
  videoUrl: string;
  description: string;
  passScore: number;
  questions: QuizQuestion[];
};

export type Course = {
  id: string;
  order: number;
  division: CourseDivision;
  divisionLabel: string;
  title: string;
  description: string;
  catalog: CourseCatalogMeta;
  subModules: CourseSubModule[];
};

export type CourseStatus = 'locked' | 'in_progress' | 'passed';
export type SubModuleStatus = CourseStatus;

const beginnerOperatorCourseId = 'beginner-operator-foundations';

export const COURSES: Course[] = [
  {
    id: beginnerOperatorCourseId,
    order: 1,
    division: 'operator-core',
    divisionLabel: 'Operator Core',
    title: 'Beginner Operator Foundations',
    description:
      'A complete beginner path for understanding the operator role, how earnings work, and how to use the platform step by step.',
    catalog: {
      summary:
        'Start here to learn the operator model, platform workflows, and the practical steps needed to begin operating inside the OBAOL ecosystem.',
      theme: 'builds',
      badge: 'Beginner',
      icon: 'ops',
      coverTitle: 'Beginner Operator Foundations',
      coverSubtitle: 'OBAOL OPERATOR SYSTEM',
    },
    subModules: [
      {
        id: 'beginner-operator-foundations-1',
        courseId: beginnerOperatorCourseId,
        order: 1,
        title: 'Operator Role Overview',
        videoUrl: 'https://www.youtube.com/embed/k9EXz9oULcc',
        description:
          'Learn what an operator is, why the role is asset-light, and how operators earn by coordinating deals instead of funding them.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'What does the video say an operator needs to start in this ecosystem?',
            options: ['Execution skills instead of capital or inventory', 'A warehouse and export license', 'A buyer contract before registration'],
            correctAnswer: 'Execution skills instead of capital or inventory',
          },
          {
            id: 'q2',
            question: 'How is trade described in this lesson?',
            options: ['10% discussion and 90% coordination', '50% negotiation and 50% finance', 'Mostly warehousing and trucking'],
            correctAnswer: '10% discussion and 90% coordination',
          },
          {
            id: 'q3',
            question: 'Which of these is presented as one way an operator can earn?',
            options: ['By closing deals and managing supplier relationships', 'Only by buying products with personal funds', 'Only by owning freight vehicles'],
            correctAnswer: 'By closing deals and managing supplier relationships',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-2',
        courseId: beginnerOperatorCourseId,
        order: 2,
        title: 'Commission Structure Basics',
        videoUrl: 'https://www.youtube.com/embed/-08ODNSg8io',
        description:
          'Understand how the commission pool is created, how handlers and procurement roles are paid, and why leadership layers matter.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'How is the commission pool defined in this lesson?',
            options: ['It is 50% of the trade profit', 'It is 50% of the invoice quantity', 'It is the full payment made by the buyer'],
            correctAnswer: 'It is 50% of the trade profit',
          },
          {
            id: 'q2',
            question: 'What affects how much handler commission is earned?',
            options: ['The combined buyer and seller star rating', 'Only the product category', 'The number of emails sent'],
            correctAnswer: 'The combined buyer and seller star rating',
          },
          {
            id: 'q3',
            question: 'Why does the lesson include leadership layers like L1 and L2?',
            options: ['To reward team building and mentorship', 'To replace the need for direct closers', 'To remove commissions from handlers'],
            correctAnswer: 'To reward team building and mentorship',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-3',
        courseId: beginnerOperatorCourseId,
        order: 3,
        title: 'Associate vs Operator',
        videoUrl: 'https://www.youtube.com/embed/2jNun4oZJk4',
        description:
          'See the difference between associates who run their own business operations and operators who support trade digitally and guide associates through the ecosystem.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'Which group does the lesson place under the associate category?',
            options: ['Importers, exporters, warehouse managers, and manufacturers', 'Only retired customs brokers', 'Only digital platform trainers'],
            correctAnswer: 'Importers, exporters, warehouse managers, and manufacturers',
          },
          {
            id: 'q2',
            question: 'How are operators described in the lesson?',
            options: ['Digital approach traders who manage supplier relationships and support execution', 'Investors who must own a trading company', 'Warehouse supervisors who only manage stock rooms'],
            correctAnswer: 'Digital approach traders who manage supplier relationships and support execution',
          },
          {
            id: 'q3',
            question: 'What role do operators play for associates on the platform?',
            options: ['They act as a bridge and provide one-to-one support', 'They replace associates entirely', 'They only handle tax filing'],
            correctAnswer: 'They act as a bridge and provide one-to-one support',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-4',
        courseId: beginnerOperatorCourseId,
        order: 4,
        title: 'Associate Supplier Ownership',
        videoUrl: 'https://www.youtube.com/embed/9cG7NUTaxGE',
        description:
          'Learn why building strong associate relationships becomes a long-term asset and how supplier ownership can create recurring commission opportunities.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'What does the lesson call your main asset in this model?',
            options: ['Associate supplier ownership', 'Office rent savings', 'Personal transport equipment'],
            correctAnswer: 'Associate supplier ownership',
          },
          {
            id: 'q2',
            question: 'How do commissions start coming from associates in this lesson?',
            options: ['From inquiries and sales linked to their listed products', 'From charging them a joining fee', 'From moving their company to a new location'],
            correctAnswer: 'From inquiries and sales linked to their listed products',
          },
          {
            id: 'q3',
            question: 'What helps associates trust you enough to send inquiries through you?',
            options: ['Reliable support, tools, and relationship building', 'Aggressive pricing promises only', 'Avoiding communication after onboarding'],
            correctAnswer: 'Reliable support, tools, and relationship building',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-5',
        courseId: beginnerOperatorCourseId,
        order: 5,
        title: 'Starting Supplier Conversations',
        videoUrl: 'https://www.youtube.com/embed/8JDINukmwBA',
        description:
          'Practice three practical ways to open supplier conversations: inquiry-based outreach, product mastery, and shared regional connection.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'What is the purpose of the inquiry method?',
            options: ['To create value by discussing a real inquiry with the supplier', 'To avoid talking about actual products', 'To collect names without any context'],
            correctAnswer: 'To create value by discussing a real inquiry with the supplier',
          },
          {
            id: 'q2',
            question: 'Why does product mastery help an operator?',
            options: ['It lets the operator speak with useful expertise about a product', 'It removes the need to contact suppliers', 'It guarantees instant orders'],
            correctAnswer: 'It lets the operator speak with useful expertise about a product',
          },
          {
            id: 'q3',
            question: 'How does the regional method help in first conversations?',
            options: ['Shared culture or language can reduce barriers and build trust faster', 'It replaces all product discussions', 'It only works after a contract is signed'],
            correctAnswer: 'Shared culture or language can reduce barriers and build trust faster',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-6',
        courseId: beginnerOperatorCourseId,
        order: 6,
        title: 'Adding an Associate and Company',
        videoUrl: 'https://www.youtube.com/embed/afckHaCf3kQ',
        description:
          'Follow the company page workflow to add an associate, enter company details, select the correct function, and activate the company with valid information.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'Where does this process start inside the panel?',
            options: ['On the company page in the left sidebar', 'On the leaderboard page', 'Inside the execution panel'],
            correctAnswer: 'On the company page in the left sidebar',
          },
          {
            id: 'q2',
            question: 'Why is choosing the company function important?',
            options: ['It changes how the panel looks and works for that company', 'It only changes the company logo color', 'It is used only for billing'],
            correctAnswer: 'It changes how the panel looks and works for that company',
          },
          {
            id: 'q3',
            question: 'What is required before successful activation?',
            options: ['A valid company email and accurate company details', 'A sample request from the buyer', 'A warehouse bid from another company'],
            correctAnswer: 'A valid company email and accurate company details',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-7',
        courseId: beginnerOperatorCourseId,
        order: 7,
        title: 'Adding Products and Making Them Live',
        videoUrl: 'https://www.youtube.com/embed/hzj3wfSJu5s',
        description:
          'Learn how to create a product listing, assign associates and supply locations, publish it live, and understand marketplace actions like inquiries and sample requests.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'Which step is part of creating a product listing in this lesson?',
            options: ['Choosing category, pricing, unit, associate, and supply location', 'Only uploading a courier receipt', 'Only entering a star rating'],
            correctAnswer: 'Choosing category, pricing, unit, associate, and supply location',
          },
          {
            id: 'q2',
            question: 'How long do live products stay active on the marketplace according to the lesson?',
            options: ['24 hours', '7 days', '30 days'],
            correctAnswer: '24 hours',
          },
          {
            id: 'q3',
            question: 'What is one difference between an inquiry and a sample request?',
            options: ['An inquiry is for purchase needs, while a sample request is for testing the product', 'They are exactly the same action', 'A sample request is only for internal admin use'],
            correctAnswer: 'An inquiry is for purchase needs, while a sample request is for testing the product',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-8',
        courseId: beginnerOperatorCourseId,
        order: 8,
        title: 'Sample Request Workflow',
        videoUrl: 'https://www.youtube.com/embed/LmEhAlmv3xo',
        description:
          'Walk through the sample request flow from buyer request to supplier quote, buyer approval, shipment tracking, and final acceptance.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'What does a buyer fill in when starting a sample request?',
            options: ['Product, associate, delivery details, and sample quantity', 'Only a courier tracking number', 'Only the final invoice amount'],
            correctAnswer: 'Product, associate, delivery details, and sample quantity',
          },
          {
            id: 'q2',
            question: 'Who sets the sample price in this workflow?',
            options: ['The supplier submits the quote', 'The buyer sets the supplier price', 'The platform hides the price until delivery'],
            correctAnswer: 'The supplier submits the quote',
          },
          {
            id: 'q3',
            question: 'Why is the sample request feature important in B2B trade?',
            options: ['It helps buyers verify product quality before bulk orders', 'It replaces the need for any inquiry process', 'It is only used for domestic tax filing'],
            correctAnswer: 'It helps buyers verify product quality before bulk orders',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-9',
        courseId: beginnerOperatorCourseId,
        order: 9,
        title: 'Inquiry Management to Order',
        videoUrl: 'https://www.youtube.com/embed/h1oSLeym1iQ',
        description:
          'Understand how inquiries are created, how roles and responsibilities are assigned, how documents and revisions are handled, and how an inquiry becomes an order.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'Which three operator roles are highlighted in the inquiry workflow?',
            options: ['Supplier owner, deal closer, and handler', 'Buyer, courier, and tax officer', 'Broker, auditor, and recruiter'],
            correctAnswer: 'Supplier owner, deal closer, and handler',
          },
          {
            id: 'q2',
            question: 'What document is automatically generated when the buyer initiates an inquiry?',
            options: ['LOI or Letter of Intent', 'Warehouse lease', 'Customs duty receipt'],
            correctAnswer: 'LOI or Letter of Intent',
          },
          {
            id: 'q3',
            question: 'What is the final step that converts the inquiry into an official order?',
            options: ['Creating the purchase order', 'Refreshing the marketplace page', 'Changing the company function'],
            correctAnswer: 'Creating the purchase order',
          },
        ],
      },
      {
        id: 'beginner-operator-foundations-10',
        courseId: beginnerOperatorCourseId,
        order: 10,
        title: 'Execution Panel and Bidding Flow',
        videoUrl: 'https://www.youtube.com/embed/01rSKsU93dA',
        description:
          'See how the execution panel publishes responsibilities like packaging and transportation for bidding and how admins select the winning service provider.',
        passScore: 2,
        questions: [
          {
            id: 'q1',
            question: 'What kinds of responsibilities are shown in the execution panel example?',
            options: ['Services like packaging and inland transportation', 'Only operator login tasks', 'Only profile update requests'],
            correctAnswer: 'Services like packaging and inland transportation',
          },
          {
            id: 'q2',
            question: 'What happens after a responsibility event is published?',
            options: ['Different companies can place bids to handle it', 'The order closes automatically', 'The buyer loses access to the order'],
            correctAnswer: 'Different companies can place bids to handle it',
          },
          {
            id: 'q3',
            question: 'Who chooses the winning bid when multiple bids are available?',
            options: ['An operator or admin', 'The courier company automatically', 'Only the warehouse manager'],
            correctAnswer: 'An operator or admin',
          },
        ],
      },
    ],
  },
];

const LEGACY_MODULE_TO_COURSE: Record<string, string> = {};

export function getAllCourses() {
  return [...COURSES].sort((a, b) => a.order - b.order);
}

export function getCourseById(id: string) {
  return getAllCourses().find((course) => course.id === id) || null;
}

export function getAllSubModules() {
  return getAllCourses()
    .flatMap((course) => course.subModules)
    .sort((a, b) => {
      if (a.courseId === b.courseId) return a.order - b.order;
      const courseA = getCourseById(a.courseId)?.order || 0;
      const courseB = getCourseById(b.courseId)?.order || 0;
      return courseA - courseB;
    });
}

export function getSubModuleById(id: string) {
  return getAllSubModules().find((subModule) => subModule.id === id) || null;
}

export function getNextUnlockedSubModule(passedSubModuleIds: Set<string>) {
  const ordered = getAllCourses();
  for (const course of ordered) {
    for (const subModule of [...course.subModules].sort((a, b) => a.order - b.order)) {
      if (passedSubModuleIds.has(subModule.id)) continue;
      if (isSubModuleUnlocked(subModule.id, passedSubModuleIds)) return subModule;
    }
  }
  return null;
}

export function isSubModuleUnlocked(subModuleId: string, passedSubModuleIds: Set<string>) {
  const courses = getAllCourses();
  const targetCourse = courses.find((course) => course.subModules.some((sub) => sub.id === subModuleId));
  if (!targetCourse) return false;

  const orderedSubs = [...targetCourse.subModules].sort((a, b) => a.order - b.order);
  const targetIndex = orderedSubs.findIndex((sub) => sub.id === subModuleId);
  if (targetIndex === -1) return false;

  if (targetIndex === 0) return true;

  const previousSub = orderedSubs[targetIndex - 1];
  return passedSubModuleIds.has(previousSub.id);
}

export function expandLegacyPassedModuleIds(rawPassedIds: Set<string>) {
  const expanded = new Set(rawPassedIds);
  for (const [legacyId, courseId] of Object.entries(LEGACY_MODULE_TO_COURSE)) {
    if (!rawPassedIds.has(legacyId)) continue;
    const course = getCourseById(courseId);
    if (!course) continue;
    for (const sub of course.subModules) expanded.add(sub.id);
  }
  return expanded;
}
