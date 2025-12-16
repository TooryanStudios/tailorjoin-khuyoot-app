import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import TailorJoinFlow from '../features/tailor-join/TailorJoinFlow';

const Routes = () => {
    return (
        <Router>
            <Switch>
                <Route path="/join-tailor" component={TailorJoinFlow} />
                {/* Add more routes here as needed */}
            </Switch>
        </Router>
    );
};

export default Routes;