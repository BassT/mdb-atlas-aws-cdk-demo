import { App } from "aws-cdk-lib";
import { DemoStack } from "./demo-stack";

const app = new App();
new DemoStack(app, "DemoStack");
