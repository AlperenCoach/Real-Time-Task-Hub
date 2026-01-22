using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RT_API.Migrations
{
    /// <inheritdoc />
    public partial class RenameColumnToCompletedallTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // PostgreSQL'de kolon adını değiştir
            migrationBuilder.Sql(@"
                ALTER TABLE task_counter 
                RENAME COLUMN ""totalCompletedTasks"" TO ""completedallTasks"";
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Kolon adını geri değiştir
            migrationBuilder.Sql(@"
                ALTER TABLE task_counter 
                RENAME COLUMN ""completedallTasks"" TO ""totalCompletedTasks"";
            ");
        }
    }
}
