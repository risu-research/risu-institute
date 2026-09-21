# frozen_string_literal: true
# Original Octokit code is selected by Ruby's -I path. This file is ONLY a test caller.
require 'json'
require 'octokit'
base = ENV.fetch('MOCK_API_BASE')
version = ENV.fetch('CONTRACT_VERSION')
mode = ENV.fetch('CALL_MODE')
client = Octokit::Client.new(
  api_endpoint: base,
  access_token: ENV.fetch('TEST_TOKEN', 'full'),
  connection_options: { headers: { 'X-GitHub-Api-Version' => version } }
)
rows = []
count = %w[default_twice details_two].include?(mode) ? 2 : 1
count.times do |index|
  row = { index: index }
  begin
    kwargs = {}
    kwargs[:return_run_details] = true if mode.start_with?('details')
    outcome = client.workflow_dispatch('acme/infra', 'deploy.yml', 'main', kwargs)
    row[:return_type] = outcome.class.name
    row[:return_value] = [true, false].include?(outcome) ? outcome : 'RESOURCE'
    if outcome.respond_to?(:workflow_run_id) && outcome.workflow_run_id
      row[:run_id] = outcome.workflow_run_id
      row[:run_url] = outcome.run_url
      begin
        followup = client.workflow_run('acme/infra', outcome.workflow_run_id)
        row[:run_status] = followup.status
        row[:run_conclusion] = followup.conclusion
      rescue StandardError => e
        row[:followup_error] = "#{e.class}: #{e.message[0,180]}"
      end
    end
  rescue StandardError => e
    row[:dispatch_error] = "#{e.class}: #{e.message[0,180]}"
  end
  rows << row
end
puts JSON.generate({ revision: ENV.fetch('SDK_REV'), contract_version: version, mode: mode, calls: rows })
