# INICIAR APP BACKEND
uvicorn app.main:app --reload

# INICIAR BD 
psql -U postgres -h localhost
contraseña: postgres

# COMANDOS DE POSTGRES
Cambiar de BD: \c nombre_bd
Listar BDs: \l
Listar tablas: \dt
