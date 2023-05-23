import { CfnProject } from "@mongodbatlas-awscdk/project";
import {
  CfnTypeActivation,
  NestedStack,
  NestedStackProps,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import {
  Role,
  CompositePrincipal,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
  Effect,
} from "aws-cdk-lib/aws-iam";
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

    const prerequisites = new PrerequisitesStack(this, "PrerequisitesStack");
    const project = new ProjectStack(this, "ProjectStack");

    project.addDependency(prerequisites);
  }
}

class PrerequisitesStack extends NestedStack {
  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // execution role
    // https://github.com/mongodb/mongodbatlas-cloudformation-resources/blob/master/examples/execution-role.yaml
    const executionRole = new Role(this, "DemoStackMongoDBAtlasExecutionRole", {
      roleName: "DemoStackMongoDBAtlasExecutionRole",
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("cloudformation.amazonaws.com"),
        new ServicePrincipal("resources.cloudformation.amazonaws.com"),
        new ServicePrincipal("lambda.amazonaws.com")
      ),
      inlinePolicies: {
        ResourceTypePolicy: new PolicyDocument({
          assignSids: true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "secretsmanager:CreateSecret",
                "secretsmanager:CreateSecretInput",
                "secretsmanager:DescribeSecret",
                "secretsmanager:GetSecretValue",
                "secretsmanager:PutSecretValue",
                "secretsmanager:UpdateSecretVersionStage",
                "ec2:CreateVpcEndpoint",
                "ec2:DeleteVpcEndpoints",
                "cloudformation:CreateResource",
                "cloudformation:DeleteResource",
                "cloudformation:GetResource",
                "cloudformation:GetResourceRequestStatus",
                "cloudformation:ListResources",
                "cloudformation:UpdateResource",
                "iam:AttachRolePolicy",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:GetRole",
                "iam:GetRolePolicy",
                "iam:ListAttachedRolePolicies",
                "iam:ListRolePolicies",
                "iam:PutRolePolicy",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    // extensions
    [CfnProject.CFN_RESOURCE_TYPE_NAME]
      .map((type) => type.replace(/::/g, "-"))
      .map(
        (type) =>
          new CfnTypeActivation(this, `DemoStackTypeActiviation${type}`, {
            publicTypeArn: `arn:aws:cloudformation:${REGION}::type/resource/bb989456c78c398a858fef18f2ca1bfc1fbba082/${type}`,
            executionRoleArn: executionRole.roleArn,
          })
      );
  }
}

class ProjectStack extends NestedStack {
  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    new CfnProject(this, "DemoStackAtlasProject", {
      name: "Demo",
      orgId: ATLAS_ORG_ID,
    });
  }
}
