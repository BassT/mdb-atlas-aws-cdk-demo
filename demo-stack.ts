import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

const REGION = "eu-west-1";
const ATLAS_ORG_ID = "{{ATLAS_ORG_ID}}";
const VPC = {
  id: "{{AWS_VPC_ID}}  ",
  cidrBlock: "10.0.0.0/24",
  accountId: "{{AWS_ACCOUNT_ID}}",
};

export class DemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }
}
