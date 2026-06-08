import {
  type CourseStatus,
  type CourseCatalogMeta,
  type SubModuleStatus,
  expandLegacyPassedModuleIds,
  getAllCourses,
  getAllSubModules,
  getNextUnlockedSubModule,
  isSubModuleUnlocked,
} from '../config/courses';

export type SubModuleProgressItem = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  status: SubModuleStatus;
  draftAnswers: Record<string, string>;
};

export type CourseProgressItem = {
  id: string;
  title: string;
  description: string;
  division: string;
  divisionLabel: string;
  order: number;
  catalog: CourseCatalogMeta;
  status: CourseStatus;
  percentComplete: number;
  completedSubModules: number;
  totalSubModules: number;
  activeSubModuleId: string | null;
  subModules: SubModuleProgressItem[];
};

export type CourseProgressSummary = {
  totalCourses: number;
  passedCourses: number;
  totalSubModules: number;
  passedSubModules: number;
  overallPercent: number;
  totalPoints: number;
  currentCourseId: string | null;
  currentSubModuleId: string | null;
  courses: CourseProgressItem[];
};

export const SUBMODULE_PASS_POINTS = 10;
export const COURSE_COMPLETION_POINTS = 25;

export function calculateCoursePoints(completedSubModules: number, totalSubModules: number) {
  const completionBonus = totalSubModules > 0 && completedSubModules === totalSubModules ? COURSE_COMPLETION_POINTS : 0;
  return completedSubModules * SUBMODULE_PASS_POINTS + completionBonus;
}

export function buildCourseProgressSummary(
  rawPassedIds: Set<string>,
  draftBySubModuleId: Record<string, Record<string, string>> = {},
  lastActiveSubModuleId: string | null = null
): CourseProgressSummary {
  const passedSubModuleIds = expandLegacyPassedModuleIds(rawPassedIds);
  const courses = getAllCourses();

  const items: CourseProgressItem[] = courses.map((course) => {
    const subModules: SubModuleProgressItem[] = [...course.subModules]
      .sort((a, b) => a.order - b.order)
      .map((sub) => {
        let status: SubModuleStatus = 'locked';
        if (passedSubModuleIds.has(sub.id)) {
          status = 'passed';
        } else if (isSubModuleUnlocked(sub.id, passedSubModuleIds)) {
          status = 'in_progress';
        }

        return {
          id: sub.id,
          courseId: sub.courseId,
          title: sub.title,
          order: sub.order,
          status,
          draftAnswers: draftBySubModuleId[sub.id] || {},
        };
      });

    const allPassed = subModules.every((sub) => sub.status === 'passed');
    const completedSubModules = subModules.filter((sub) => sub.status === 'passed').length;
    const totalSubModules = subModules.length;
    const activeSubModuleId = subModules.find((sub) => sub.status === 'in_progress')?.id || (allPassed ? subModules.at(-1)?.id || null : null);

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      division: course.division,
      divisionLabel: course.divisionLabel,
      order: course.order,
      catalog: course.catalog,
      status: allPassed ? 'passed' : 'in_progress',
      percentComplete: totalSubModules ? Math.round((completedSubModules / totalSubModules) * 100) : 0,
      completedSubModules,
      totalSubModules,
      activeSubModuleId,
      subModules,
    };
  });

  const passedCourses = items.filter((item) => item.status === 'passed').length;
  const totalSubModules = getAllSubModules().length;
  const passedSubModules = items.reduce((acc, item) => acc + item.subModules.filter((sub) => sub.status === 'passed').length, 0);
  const totalPoints = items.reduce((acc, item) => acc + calculateCoursePoints(item.completedSubModules, item.totalSubModules), 0);

  const currentUnlocked = getNextUnlockedSubModule(passedSubModuleIds);

  const lastActiveUnlocked =
    lastActiveSubModuleId &&
    items
      .flatMap((course) => course.subModules)
      .some((sub) => sub.id === lastActiveSubModuleId && sub.status !== 'locked')
      ? lastActiveSubModuleId
      : null;

  const currentSubModuleId = lastActiveUnlocked || currentUnlocked?.id || null;

  const currentCourseId =
    currentSubModuleId
      ? items.find((course) => course.subModules.some((sub) => sub.id === currentSubModuleId))?.id || null
      : null;

  return {
    totalCourses: items.length,
    passedCourses,
    totalSubModules,
    passedSubModules,
    overallPercent: totalSubModules ? Math.round((passedSubModules / totalSubModules) * 100) : 0,
    totalPoints,
    currentCourseId,
    currentSubModuleId,
    courses: items,
  };
}

export function areAllCoursesPassed(rawPassedIds: Set<string>) {
  const passedSubModuleIds = expandLegacyPassedModuleIds(rawPassedIds);
  const courses = getAllCourses();
  return courses.length > 0 && courses.every((course) => course.subModules.every((sub) => passedSubModuleIds.has(sub.id)));
}
