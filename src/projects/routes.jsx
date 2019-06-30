import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { withProps } from 'recompose'
import { renderApp } from '../components/App/App'
import ProjectLayout from './detail/components/ProjectLayout'
import Projects from './list/components/Projects/Projects'
import TopBarContainer from '../components/TopBar/TopBarContainer'
import ProjectsToolBar from '../components/TopBar/ProjectsToolBar'
import ProjectToolBar from '../components/TopBar/ProjectToolBar'
import FileDownload from '../components/FileDownload'
import ProjectDetail from './detail/ProjectDetail'
import Dashboard from './detail/containers/DashboardContainer'
import Messages from './detail/containers/MessagesContainer'
import Scope from './detail/containers/ScopeContainer'
import ProjectPlan from './detail/containers/ProjectPlanContainer'
import ProjectAddPhaseContainer from './detail/containers/ProjectAddPhaseContainer'
import CoderBot from '../components/CoderBot/CoderBot'
import SpecificationContainer from './detail/containers/SpecificationContainer'
import { requiresAuthentication } from '../components/AuthenticatedComponent'

const ProjectLayoutWithAuth = requiresAuthentication(ProjectLayout)
const FileDownloadWithAuth = requiresAuthentication(FileDownload)

const ProjectDetailWithAuth = withProps({ main:
  <Switch>
    <Route exact path="/projects/:projectId" render={() => <ProjectDetail component={Dashboard} />} />
    <Route path="/projects/:projectId/messages/:topicId" render={() => <ProjectDetail component={Messages} />} />
    <Route path="/projects/:projectId/messages" render={() => <ProjectDetail component={Messages} />} />
    <Route path="/projects/:projectId/status/:statusId" render={() => <ProjectDetail component={Dashboard} />} />
    <Route path="/projects/:projectId/specification" render={() => <ProjectDetail component={SpecificationContainer} />} />
    <Route path="/projects/:projectId/scope" render={() => <ProjectDetail component={Scope} />} />
    <Route path="/projects/:projectId/plan" render={() => <ProjectDetail component={ProjectPlan} />} />
    <Route path="/projects/:projectId/add-phase" render={() => <ProjectDetail component={ProjectAddPhaseContainer} />} />
    <Route render={() => <CoderBot code={404}/>} />
  </Switch>
})(ProjectLayoutWithAuth)

const ProjectsWithAuth = requiresAuthentication(Projects)

const projectRoutes = (
  <Route
    path="/projects"
    render={() => (
      <Switch>
        <Route path="/projects/messages/attachments/:messageAttachmentId" render={renderApp(<FileDownloadWithAuth />, null)} />
        <Route path="/projects/:projectId/attachments/:attachmentId" render={renderApp(<FileDownloadWithAuth />, null)} />
        <Route path="/projects/:projectId" render={renderApp(<TopBarContainer toolbar={ProjectToolBar} />, <ProjectDetailWithAuth />)} />
        <Route path="/projects" render={renderApp(<TopBarContainer toolbar={ProjectsToolBar} />, <ProjectsWithAuth />)} />
      </Switch>
    )}
  />
)

export default projectRoutes
