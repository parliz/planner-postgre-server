create TABLE person(
    user_id SERIAL PRIMARY KEY,
    user_login VARCHAR(255),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_password_hash VARCHAR(255)
)

create TABLE task(
    task_id SERIAL PRIMARY KEY,
    task_comment VARCHAR(255),
    is_task_done BOOLEAN,
    task_start_time DATE,
    task_end_time DATE,
    task_user_id INTEGER,
    FOREIGN KEY (task_user_id) references person(user_id)
)
