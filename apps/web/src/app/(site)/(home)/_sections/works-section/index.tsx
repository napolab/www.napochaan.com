import { WorksSection } from '../../../_components/works-section';
import { findWorksList } from '@lib/payload/works';

export const WorksSectionLoader = async () => {
  const works = await findWorksList();
  const homeWorks = [...works].slice(0, 3);

  return <WorksSection id="works" works={homeWorks} />;
};
