create TABLE person(
    user_id SERIAL PRIMARY KEY,
    user_login VARCHAR(255),
    user_email VARCHAR(255),
    user_password_hash VARCHAR(255),
    user_language VARCHAR(10)
)

create TABLE task(
    task_id SERIAL PRIMARY KEY,
    task_comment VARCHAR(255),
    is_task_done BOOLEAN,
    task_date date,
    task_user_id INTEGER,
    FOREIGN KEY (task_user_id) references person(user_id)
)

create TABLE project(
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255),
    project_creator INTEGER,
    FOREIGN KEY (project_creator) references person(user_id)
)

create TABLE PersonToProject(
    project_id INTEGER,
    person_id INTEGER,
    FOREIGN KEY (person_id) references person(user_id),
	FOREIGN KEY (project_id) references project(project_id)
)

create TABLE projectTask(
    project_task_id SERIAL PRIMARY KEY,
    project_id INTEGER,
    project_task_title VARCHAR(255),
    project_task_responsible INTEGER,
    project_task_start_time timestamp,
    project_task_end_time timestamp,
    project_task_status VARCHAR(255),
    project_task_priority VARCHAR(255),
    FOREIGN KEY (project_task_responsible) references person(user_id)
    FOREIGN KEY (project_id) references project(project_id)
)

create TABLE TaskComment(
	comment_id SERIAL PRIMARY KEY,
    project_task_id INTEGER,
    project_task_comment VARCHAR(255),
	project_task_creation_date TIMESTAMP,
    FOREIGN KEY (project_task_id) references projectTask(project_task_id)
)

create TABLE list(
    list_id SERIAL PRIMARY KEY,
    list_name VARCHAR(255),
    list_creator INTEGER,
    list_participant INTEGER,
    FOREIGN KEY (list_creator) references person(user_id),
    FOREIGN KEY (list_participant) references person(user_id)
)

create TABLE PersonToList(
    list_id INTEGER,
    person_id INTEGER,
    FOREIGN KEY (person_id) references person(user_id),
	FOREIGN KEY (list_id) references list(list_id)
)

create TABLE listItem(
    list_item_id SERIAL PRIMARY KEY,
	list_id INTEGER,
    list_item_title VARCHAR(255),
    list_item_img VARCHAR(255),
    list_item_text VARCHAR(500),
    list_item_is_done BOOLEAN,
    FOREIGN KEY (list_id) references list(list_id)
)
