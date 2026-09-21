# frozen_string_literal: true
require 'json'
require 'octokit'
base=ENV.fetch('MOCK_API_BASE')
version=ENV.fetch('CONTRACT_VERSION')
client=Octokit::Client.new(api_endpoint: base, access_token: 'full', connection_options: {headers: {'X-GitHub-Api-Version'=>version}})
r=client.post('/repos/acme/infra/actions/workflows/deploy.yml/dispatches', ref:'main', inputs:{target:'production'}, return_run_details:true)
id=r.workflow_run_id
run=client.workflow_run('acme/infra',id)
puts JSON.generate({method:'original Octokit Client#post and Client#workflow_run',run_id:id,status:run.status,conclusion:run.conclusion})
