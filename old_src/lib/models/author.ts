import {
  AutoIncrement,
  BelongsTo,
  Column,
  createIndexDecorator,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript'
import { Note, User } from './index'

const NoteUserIndex = createIndexDecorator({ unique: true })

@Table
export class Author extends Model<Author> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number

  @Column(DataType.STRING)
  color: string

  @ForeignKey(() => Note)
  @NoteUserIndex
  @Column(DataType.UUID)
  noteId: string

  @BelongsTo(() => Note, { foreignKey: 'noteId', onDelete: 'CASCADE', constraints: false, hooks: true })
  note: Note

  @ForeignKey(() => User)
  @NoteUserIndex
  @Column(DataType.UUID)
  userId: string

  @BelongsTo(() => User, { foreignKey: 'userId', onDelete: 'CASCADE', constraints: false, hooks: true })
  user: User
}
