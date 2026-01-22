using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RT_API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCompletedallTasksFromTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // tasks tablosundan yanlışlıkla eklenen completedallTasks kolonunu kaldır
            migrationBuilder.Sql(@"
                ALTER TABLE tasks DROP COLUMN IF EXISTS ""completedallTasks"";
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Geri almak için kolonu tekrar ekle (gerekirse)
            migrationBuilder.AddColumn<int>(
                name: "completedallTasks",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
