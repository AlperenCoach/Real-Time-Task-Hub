using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RT_API.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskCounter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "task_counter",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    completedallTasks = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_counter", x => x.id);
                });

            // İlk kaydı ekle (PostgreSQL için)
            migrationBuilder.Sql(@"
                INSERT INTO task_counter (id, ""completedallTasks"") 
                VALUES (1, 0) 
                ON CONFLICT (id) DO NOTHING;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "task_counter");
        }
    }
}
