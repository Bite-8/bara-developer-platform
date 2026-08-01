exports.up = async function up(knex) {
  await knex.schema.createTable('idp_operation_log', table => {
    table.string('id').primary();
    table.string('operation_log_ref').notNullable();
    table.string('project_ref').notNullable();
    table.string('target_entity_ref').notNullable();
    table.string('environment_ref');
    table.string('template_ref');
    table.string('plan_ref');
    table.string('action_run_ref');
    table.string('event_type').notNullable();
    table.string('status').notNullable();
    table.string('created_at').notNullable();
    table.text('payload').notNullable();
  });

  await knex.schema.createTable('idp_plan_summary', table => {
    table.string('id').primary();
    table.string('plan_ref').notNullable();
    table.string('intent_id');
    table.string('project_ref').notNullable();
    table.string('target_entity_ref').notNullable();
    table.string('event_type').notNullable();
    table.string('status').notNullable();
    table.string('required_approval').notNullable();
    table.string('created_at').notNullable();
    table.text('payload').notNullable();
  });

  await knex.schema.createTable('idp_action_run_summary', table => {
    table.string('id').primary();
    table.string('action_run_ref').notNullable();
    table.string('plan_ref');
    table.string('project_ref').notNullable();
    table.string('target_entity_ref').notNullable();
    table.string('mode').notNullable();
    table.string('external_execution_ref');
    table.string('event_type').notNullable();
    table.string('status').notNullable();
    table.string('created_at').notNullable();
    table.text('payload').notNullable();
  });

  await knex.schema.alterTable('idp_operation_log', table => {
    table.index(['project_ref', 'created_at'], 'idx_idp_oplog_project_created');
    table.index(
      ['target_entity_ref', 'created_at'],
      'idx_idp_oplog_target_created',
    );
  });

  await knex.schema.alterTable('idp_plan_summary', table => {
    table.index(['project_ref', 'created_at'], 'idx_idp_plan_project_created');
    table.index(
      ['target_entity_ref', 'created_at'],
      'idx_idp_plan_target_created',
    );
  });

  await knex.schema.alterTable('idp_action_run_summary', table => {
    table.index(
      ['project_ref', 'created_at'],
      'idx_idp_action_project_created',
    );
    table.index(
      ['target_entity_ref', 'created_at'],
      'idx_idp_action_target_created',
    );
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('idp_action_run_summary');
  await knex.schema.dropTableIfExists('idp_plan_summary');
  await knex.schema.dropTableIfExists('idp_operation_log');
};
