# BIllyBot Backend

## Running Serverless Stack Locally

1: Ensure you have a valid [aws account](https://serverless-stack.com/chapters/create-an-aws-account.html)

2: Create a valid [IAM User](https://serverless-stack.com/chapters/create-an-iam-user.html)

3: Copy The `Secret Access Key` and `Access Key Id` (do not lose these)

4: Install the [Aws cli](https://serverless-stack.com/chapters/configure-the-aws-cli.html)

5: in terminal, run

	aws configure

 and enter your `Secret Access Key` and `Access Key Id`

6: clone this backend repository locally

7: `compose up` the necessary mongodb docker image provided in the dev container

8: run `pnpm install`

9: run `pnpm start local`

10: begin making requests either through curl or the team postman workspace (will have to request access)
